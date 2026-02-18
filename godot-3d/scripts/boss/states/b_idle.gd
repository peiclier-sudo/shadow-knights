# b_idle.gd  —  Boss FSM: Idle
# Brief settling pause before moving to Chase.
class_name BStateIdle
extends State

const IDLE_DURATION: float = 0.5

var _timer: float = 0.0

func enter(_msg: Dictionary = {}) -> void:
	_timer = IDLE_DURATION
	actor.velocity.x = 0.0
	actor.velocity.z = 0.0
	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("idle")

func update(delta: float) -> void:
	_timer -= delta
	if _timer <= 0.0:
		transition_to("Chase")
