# b_recover.gd  —  Boss FSM: Recover
# Post-attack recovery window — the player's punish opportunity.
# Also handles lethal death to freeze the boss in place.
class_name BStateRecover
extends State

const DEFAULT_DURATION: float = 0.5

var _timer: float = 0.0
var _lethal: bool = false

func enter(msg: Dictionary = {}) -> void:
	_lethal = msg.get("lethal", false)
	_timer = msg.get("duration", DEFAULT_DURATION)

	actor.velocity.x = 0.0
	actor.velocity.z = 0.0

	if _lethal:
		if actor.has_node("AnimationPlayer"):
			actor.get_node("AnimationPlayer").play("death")
		return  # Stay frozen; scene reload handles the rest.

	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("idle")

func update(delta: float) -> void:
	if _lethal:
		return
	_timer -= delta
	if _timer <= 0.0:
		transition_to("Chase")
