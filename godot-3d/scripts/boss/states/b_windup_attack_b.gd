# b_windup_attack_b.gd  —  Boss FSM: Attack B — Lunging Thrust
# Telegraph: 0.55 s  |  Active: 0.14 s  |  Recovery: 0.70 s
# Medium speed, linear tracking — reaction check for the player.
class_name BStateWindupAttackB
extends State

const TELEGRAPH_S: float = 0.55
const ACTIVE_S: float    = 0.14
const RECOVERY_S: float  = 0.70
const LUNGE_SPEED: float = 14.0   # Covers 2–3 m in the active window.
const ATTACK_ID: String  = "thrust"

enum Phase { TELEGRAPH, ACTIVE, RECOVERY }
var _phase: Phase = Phase.TELEGRAPH
var _timer: float = 0.0
var _lunge_dir: Vector3 = Vector3.ZERO

func enter(_msg: Dictionary = {}) -> void:
	_phase = Phase.TELEGRAPH
	_timer = TELEGRAPH_S

	actor.velocity.x = 0.0
	actor.velocity.z = 0.0

	var boss := actor as BossController
	if boss and boss.get_player():
		boss.face_toward_instant(boss.get_player().global_position)
		_lunge_dir = boss.direction_to_player()

	SignalBus.boss_attack_telegraphed.emit(ATTACK_ID, TELEGRAPH_S)

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_thrust_windup")

func update(delta: float) -> void:
	_timer -= delta
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

func physics_update(_delta: float) -> void:
	if _phase == Phase.ACTIVE:
		actor.velocity.x = _lunge_dir.x * LUNGE_SPEED
		actor.velocity.z = _lunge_dir.z * LUNGE_SPEED

func exit() -> void:
	if actor.hitbox:
		actor.hitbox.deactivate()
	actor.velocity.x = 0.0
	actor.velocity.z = 0.0
	SignalBus.boss_attack_ended.emit(ATTACK_ID)

func _enter_active() -> void:
	_phase = Phase.ACTIVE
	_timer = ACTIVE_S

	var boss := actor as BossController
	var def := boss.attack_def_thrust if boss else null
	if actor.hitbox and def:
		actor.hitbox.activate(actor, def)
	SignalBus.boss_attack_active.emit(ATTACK_ID)

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_thrust_active")

func _enter_recovery() -> void:
	_phase = Phase.RECOVERY
	_timer = RECOVERY_S
	actor.velocity.x = 0.0
	actor.velocity.z = 0.0
	if actor.hitbox:
		actor.hitbox.deactivate()
	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_thrust_recovery")
