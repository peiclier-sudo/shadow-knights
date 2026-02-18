# lockon_camera_controller.gd
# Third-person lock-on camera for the combat arena.
# Attach to the CombatCameraRig node (Node3D root of the camera scene).
#
# Architecture:
#   CombatCameraRig (this script)
#     └── SpringArm3D  "SpringArm"     ← handles collision
#           └── Camera3D "Camera"
#
# Tuning values from plan / CameraProfile resource:
#   Lock max distance : 18 m
#   Break distance    : 22 m
#   LOS grace         : 0.25 s
#   Follow smoothing  : 10.0
#   Recenter speed    : 7.0
class_name LockOnCameraController
extends Node3D

@onready var spring_arm: SpringArm3D = $SpringArm
@onready var camera: Camera3D = $SpringArm/Camera

## Assign CameraProfile resource in Inspector.
@export var profile: CameraProfile

# ---------------------------------------------------------------------------
# Runtime state
# ---------------------------------------------------------------------------

var _player: PlayerController = null
var _lock_target: LockOnTarget = null
var _los_grace_timer: float = 0.0
var _yaw: float = 0.0    # horizontal orbit angle
var _pitch: float = -15.0  # vertical orbit angle (degrees, negative = looking down)

# Mouse sensitivity for free-cam mode.
const MOUSE_SENSITIVITY: float = 0.25

# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

	# Apply profile defaults.
	if profile:
		spring_arm.spring_length = profile.arm_length

	# Notify player ref (injected by Main.gd, fallback via group).
	call_deferred("_find_player")

func _find_player() -> void:
	var players := get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		_player = players[0] as PlayerController
		if _player:
			_player.camera_rig = self

# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("lockon"):
		if _lock_target:
			_release_lockon()
		else:
			_try_acquire_lockon()

	# Free-cam orbit when not locked on.
	if not _lock_target and event is InputEventMouseMotion:
		var motion := event as InputEventMouseMotion
		_yaw -= motion.relative.x * MOUSE_SENSITIVITY
		_pitch -= motion.relative.y * MOUSE_SENSITIVITY
		_pitch = clampf(_pitch, _get_pitch_min(), _get_pitch_max())

# ---------------------------------------------------------------------------
# Tick
# ---------------------------------------------------------------------------

func _physics_process(delta: float) -> void:
	if not _player:
		return

	# Snap rig to player (smooth follow).
	var smooth := profile.follow_smoothing if profile else 10.0
	global_position = global_position.lerp(_player.global_position, smooth * delta)

	if _lock_target:
		_update_lockon(delta)
	else:
		_update_free_cam(delta)

	# Apply yaw/pitch to the SpringArm parent (the rig itself).
	rotation_degrees.y = _yaw
	spring_arm.rotation_degrees.x = _pitch

func _update_lockon(delta: float) -> void:
	var target_pos := _lock_target.global_position

	# LOS check.
	if not _has_los(target_pos):
		_los_grace_timer -= delta
		if _los_grace_timer <= 0.0:
			_release_lockon()
			return
	else:
		var grace := profile.los_grace_s if profile else 0.25
		_los_grace_timer = grace

	# Break distance.
	var dist := global_position.distance_to(target_pos)
	var break_dist := profile.break_distance if profile else 22.0
	if dist > break_dist:
		_release_lockon()
		return

	# Orbit the rig so the camera faces from player toward target.
	var to_target := (target_pos - global_position)
	to_target.y = 0.0
	if to_target.length_squared() > 0.001:
		var target_yaw := rad_to_deg(atan2(to_target.x, to_target.z))
		var recenter := profile.recenter_speed if profile else 7.0
		_yaw = lerp_angle(deg_to_rad(_yaw), deg_to_rad(target_yaw), recenter * delta)
		_yaw = rad_to_deg(_yaw)

	# Slight upward pitch when locked on.
	_pitch = lerpf(_pitch, -10.0, 5.0 * delta)

func _update_free_cam(_delta: float) -> void:
	# Slowly recenter pitch when free.
	_pitch = lerpf(_pitch, -15.0, 2.0 * _delta)

# ---------------------------------------------------------------------------
# Lock-on acquisition / release
# ---------------------------------------------------------------------------

func _try_acquire_lockon() -> void:
	if not _player:
		return
	var max_dist := profile.max_lock_distance if profile else 18.0
	var best: LockOnTarget = null
	var best_dist := INF

	for node in get_tree().get_nodes_in_group("lockon_targets"):
		if not node is LockOnTarget:
			continue
		var t := node as LockOnTarget
		if not t.is_lockable:
			continue
		var d := CombatMath.flat_distance(_player.global_position, t.global_position)
		if d < max_dist and d < best_dist:
			# Basic LOS check before acquiring.
			if _has_los(t.global_position):
				best = t
				best_dist = d

	if best:
		_lock_target = best
		var grace := profile.los_grace_s if profile else 0.25
		_los_grace_timer = grace
		SignalBus.lockon_acquired.emit(best)

func _release_lockon() -> void:
	_lock_target = null
	SignalBus.lockon_released.emit()

func _has_los(world_pos: Vector3) -> bool:
	var space := get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(
		global_position,
		world_pos,
		# Collide with Environment layer only (layer 7 = bit 6).
		64
	)
	query.exclude = [_player]
	var result := space.intersect_ray(query)
	return result.is_empty()

# ---------------------------------------------------------------------------
# Query helpers (called by player states)
# ---------------------------------------------------------------------------

func is_locked_on() -> bool:
	return _lock_target != null

func get_lock_target() -> LockOnTarget:
	return _lock_target

# ---------------------------------------------------------------------------
# Camera impulse (called by HitstopController / CameraImpulse)
# ---------------------------------------------------------------------------

func apply_impulse(strength: float) -> void:
	var impulse_node := get_node_or_null("SpringArm/Camera/CameraImpulse")
	if impulse_node and impulse_node.has_method("trigger"):
		impulse_node.trigger(strength)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

func _get_pitch_min() -> float:
	return profile.pitch_min if profile else -20.0

func _get_pitch_max() -> float:
	return profile.pitch_max if profile else 45.0
