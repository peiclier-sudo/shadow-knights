# b_windup_attack_c.gd  —  Boss FSM: Attack C — Delayed AoE Pulse
# Telegraph: 1.20 s with ring pulse visual  |  Active: 0.22 s  |  Recovery: 0.95 s
# Teaches timing over panic-rolling — the longest telegraph.
class_name BStateWindupAttackC
extends State

const TELEGRAPH_S: float = 1.20
const ACTIVE_S: float    = 0.22
const RECOVERY_S: float  = 0.95
const AOE_RADIUS: float  = 3.5    # Matches hitbox shape in Boss_01.tscn
const ATTACK_ID: String  = "aoe"

# Ring pulse visual: pulses every N seconds during telegraph.
const RING_PULSE_INTERVAL: float = 0.30

enum Phase { TELEGRAPH, ACTIVE, RECOVERY }
var _phase: Phase = Phase.TELEGRAPH
var _timer: float = 0.0
var _pulse_timer: float = 0.0

func enter(_msg: Dictionary = {}) -> void:
	_phase = Phase.TELEGRAPH
	_timer = TELEGRAPH_S
	_pulse_timer = RING_PULSE_INTERVAL

	actor.velocity.x = 0.0
	actor.velocity.z = 0.0

	SignalBus.boss_attack_telegraphed.emit(ATTACK_ID, TELEGRAPH_S)

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_aoe_windup")

func update(delta: float) -> void:
	_timer -= delta
	_pulse_timer -= delta

	# Spawn ring pulse VFX every interval during telegraph.
	if _phase == Phase.TELEGRAPH and _pulse_timer <= 0.0:
		_pulse_timer = RING_PULSE_INTERVAL
		_spawn_ring_pulse()

	match _phase:
		Phase.TELEGRAPH:
			if _timer <= 0.0:
				_enter_active()
		Phase.ACTIVE:
			if _timer <= 0.0:
				_enter_recovery()
		Phase.RECOVERY:
			if _timer <= 0.0:
				transition_to("Recover")

func exit() -> void:
	if actor.hitbox:
		actor.hitbox.deactivate()
	SignalBus.boss_attack_ended.emit(ATTACK_ID)

func _enter_active() -> void:
	_phase = Phase.ACTIVE
	_timer = ACTIVE_S

	var boss := actor as BossController
	var def := boss.attack_def_aoe if boss else null
	if actor.hitbox and def:
		actor.hitbox.activate(actor, def)
	SignalBus.boss_attack_active.emit(ATTACK_ID)

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_aoe_active")

func _enter_recovery() -> void:
	_phase = Phase.RECOVERY
	_timer = RECOVERY_S
	if actor.hitbox:
		actor.hitbox.deactivate()
	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_aoe_recovery")

func _spawn_ring_pulse() -> void:
	# Placeholder: expand a colored ring mesh outward.
	# Replace with a particle emitter or GPUParticles3D once VFX are ready.
	# For now we just log — the telegraph signal already notifies the HUD.
	pass
