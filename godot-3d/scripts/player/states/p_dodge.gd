# p_dodge.gd  —  Player FSM: Dodge
# Rolls the player in the input direction with i-frames during frames 4–17 @ 60 fps.
# Tuning values (from plan):
#   Total duration : 0.56 s
#   I-frame start  : 0.067 s (frame 4 @ 60 fps)
#   I-frame end    : 0.283 s (frame 17 @ 60 fps)
#   Travel distance: 4.2 m  (implemented as an impulse that decays)
#   Stamina cost   : 28 / 100
class_name PStateDodge
extends State

var _total_time: float = 0.56
var _iframe_start: float = 0.067
var _iframe_end: float = 0.283
var _dodge_cost: float = 28.0

var _elapsed: float = 0.0
var _iframe_active: bool = false
var _dodge_dir: Vector3 = Vector3.ZERO
var _initial_speed: float = 0.0

func enter(_msg: Dictionary = {}) -> void:
	# Read tuning from stats resource.
	if actor.stats:
		_total_time    = actor.stats.dodge_duration
		_iframe_start  = actor.stats.dodge_iframe_start
		_iframe_end    = actor.stats.dodge_iframe_end
		_dodge_cost    = actor.stats.dodge_stamina_cost

	# Spend stamina (gate check already done in calling state).
	actor.stamina_component.spend(_dodge_cost)

	_elapsed = 0.0
	_iframe_active = false

	# Capture dodge direction before zeroing velocity.
	_dodge_dir = actor.get_dodge_direction()

	# Compute initial speed from distance / duration so it feels snappy.
	var dodge_dist: float = actor.stats.dodge_distance if actor.stats else 4.2
	_initial_speed = dodge_dist / (_total_time * 0.55)  # Front-loaded decay

	# Face dodge direction immediately.
	if _dodge_dir.length_squared() > 0.001:
		actor.face_toward_instant(actor.global_position + _dodge_dir)

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("dodge")

func exit() -> void:
	# Always clear i-frames on exit.
	if _iframe_active and actor.hurtbox:
		actor.hurtbox.set_invulnerable(false)
	_iframe_active = false

func physics_update(delta: float) -> void:
	_elapsed += delta

	# --- I-frame window ---
	if not _iframe_active and _elapsed >= _iframe_start:
		_iframe_active = true
		if actor.hurtbox:
			actor.hurtbox.set_invulnerable(true)

	if _iframe_active and _elapsed >= _iframe_end:
		_iframe_active = false
		if actor.hurtbox:
			actor.hurtbox.set_invulnerable(false)

	# --- Apply decaying horizontal velocity ---
	var t := _elapsed / _total_time  # 0 → 1 over dodge
	var speed := _initial_speed * (1.0 - t * t)  # Quadratic decay
	actor.velocity.x = _dodge_dir.x * speed
	actor.velocity.z = _dodge_dir.z * speed

	# --- End of dodge ---
	if _elapsed >= _total_time:
		actor.velocity.x = 0.0
		actor.velocity.z = 0.0
		transition_to("Recover")
