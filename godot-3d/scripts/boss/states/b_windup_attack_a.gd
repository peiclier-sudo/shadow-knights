# b_windup_attack_a.gd  —  Boss FSM: Attack A — Overhead Slam
# Telegraph: 0.90 s  |  Active: 0.18 s  |  Recovery: 1.10 s
# Slow, high punish window — teaches dodge-and-punish.
class_name BStateWindupAttackA
extends State

# Tuning (mirrors plan / AttackDefinition resource)
const TELEGRAPH_S: float = 0.90
const ACTIVE_S: float    = 0.18
const RECOVERY_S: float  = 1.10
const ATTACK_ID: String  = "slam"

enum Phase { TELEGRAPH, ACTIVE, RECOVERY }
var _phase: Phase = Phase.TELEGRAPH
var _timer: float = 0.0

func enter(_msg: Dictionary = {}) -> void:
	_phase = Phase.TELEGRAPH
	_timer = TELEGRAPH_S

	actor.velocity.x = 0.0
	actor.velocity.z = 0.0

	# Face the player at the moment of commit.
	var boss := actor as BossController
	if boss and boss.get_player():
		boss.face_toward_instant(boss.get_player().global_position)

	# Signal HUD for telegraph overlay.
	SignalBus.boss_attack_telegraphed.emit(ATTACK_ID, TELEGRAPH_S)

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_slam_windup")

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

func exit() -> void:
	if actor.hitbox:
		actor.hitbox.deactivate()
	SignalBus.boss_attack_ended.emit(ATTACK_ID)

func _enter_active() -> void:
	_phase = Phase.ACTIVE
	_timer = ACTIVE_S

	var boss := actor as BossController
	var def := boss.attack_def_slam if boss else null
	if actor.hitbox and def:
		actor.hitbox.activate(actor, def)
	SignalBus.boss_attack_active.emit(ATTACK_ID)

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_slam_active")

func _enter_recovery() -> void:
	_phase = Phase.RECOVERY
	_timer = RECOVERY_S
	if actor.hitbox:
		actor.hitbox.deactivate()
	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("attack_slam_recovery")
