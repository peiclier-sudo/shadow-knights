# p_hitstun.gd  —  Player FSM: Hitstun
# Entered when the player takes a hit (or dies).
# Applies knockback, plays hit flash, waits out stagger duration.
class_name PStateHitstun
extends State

const DEFAULT_DURATION: float = 0.35
const KNOCKBACK_STRENGTH: float = 4.0

var _timer: float = 0.0
var _lethal: bool = false

func enter(msg: Dictionary = {}) -> void:
	_timer = msg.get("duration", DEFAULT_DURATION)
	_lethal = msg.get("lethal", false)

	# Apply knockback away from the attacker.
	var knockback_dir: Vector3 = msg.get("knockback_dir", Vector3.ZERO)
	var strength: float = msg.get("knockback_strength", KNOCKBACK_STRENGTH)
	if knockback_dir.length_squared() > 0.001:
		actor.velocity.x = knockback_dir.x * strength
		actor.velocity.z = knockback_dir.z * strength

	# Visual flash: briefly tint the mesh red.
	_flash_red()

	if actor.has_node("AnimationPlayer"):
		if _lethal:
			actor.get_node("AnimationPlayer").play("death")
		else:
			actor.get_node("AnimationPlayer").play("hitstun")

var _delta: float = 0.016

func update(delta: float) -> void:
	_delta = delta
	if _lethal:
		return  # Stay frozen on death until scene reloads.
	_timer -= delta
	if _timer <= 0.0:
		transition_to("Idle")

func physics_update(_delta: float) -> void:
	# Friction during hitstun.
	actor.velocity.x = move_toward(actor.velocity.x, 0.0, 20.0 * _delta)
	actor.velocity.z = move_toward(actor.velocity.z, 0.0, 20.0 * _delta)

func _flash_red() -> void:
	var mesh: MeshInstance3D = actor.get_node_or_null("MeshInstance3D") as MeshInstance3D
	if not mesh:
		return
	var mat := mesh.get_active_material(0)
	if mat and mat is StandardMaterial3D:
		var orig_color := mat.albedo_color
		mat.albedo_color = Color(1.0, 0.2, 0.2)
		# Restore after 0.1 s using a one-shot timer.
		actor.get_tree().create_timer(0.1, false).timeout.connect(
			func(): mat.albedo_color = orig_color
		)
