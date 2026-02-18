# p_attack.gd  —  Player FSM: Attack
# Executes the light attack sequence driven by timers matching AttackDefinition.
# Startup → Active (hitbox on) → Recovery → back to Idle.
# Tuning: startup 0.18 s | active 0.10 s | recovery 0.32 s
class_name PStateAttack
extends State

# Loaded from data/attacks/player_light_attack.tres via PlayerController.
var _attack_def: AttackDefinition = null

enum Phase { STARTUP, ACTIVE, RECOVERY }
var _phase: Phase = Phase.STARTUP
var _phase_timer: float = 0.0

func enter(_msg: Dictionary = {}) -> void:
	_attack_def = _get_attack_def()
	_phase = Phase.STARTUP
	_phase_timer = _attack_def.startup_s if _attack_def else 0.18

	# Lock lateral movement during attack (allow lunge to push).
	actor.velocity.x = 0.0
	actor.velocity.z = 0.0

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_light")

func exit() -> void:
	# Always deactivate hitbox when leaving attack state.
	if actor.hitbox:
		actor.hitbox.deactivate()

var _delta: float = 0.016

func update(delta: float) -> void:
	_delta = delta
	_phase_timer -= delta

	match _phase:
		Phase.STARTUP:
			if _phase_timer <= 0.0:
				_enter_active()
		Phase.ACTIVE:
			if _phase_timer <= 0.0:
				_enter_recovery()
		Phase.RECOVERY:
			if _phase_timer <= 0.0:
				transition_to("Idle")

func _enter_active() -> void:
	_phase = Phase.ACTIVE
	_phase_timer = _attack_def.active_s if _attack_def else 0.10

	# Apply forward lunge impulse.
	if _attack_def and _attack_def.forward_lunge_m > 0.0:
		var dir := -actor.global_transform.basis.z
		CombatMath.apply_lunge(actor, dir, _attack_def.forward_lunge_m)

	# Arm the hitbox.
	if actor.hitbox and _attack_def:
		actor.hitbox.activate(actor, _attack_def)

func _enter_recovery() -> void:
	_phase = Phase.RECOVERY
	_phase_timer = _attack_def.recovery_s if _attack_def else 0.32
	if actor.hitbox:
		actor.hitbox.deactivate()
	actor.velocity.x = 0.0
	actor.velocity.z = 0.0

func physics_update(_delta: float) -> void:
	# Drain lunge velocity during active/recovery.
	actor.velocity.x = move_toward(actor.velocity.x, 0.0, 18.0 * _delta)
	actor.velocity.z = move_toward(actor.velocity.z, 0.0, 18.0 * _delta)

func _get_attack_def() -> AttackDefinition:
	if actor.get("light_attack_def") != null:
		return actor.light_attack_def
	return null
