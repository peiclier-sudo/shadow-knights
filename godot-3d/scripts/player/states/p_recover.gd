# p_recover.gd  —  Player FSM: Recover
# Short locked window after an action (attack end, dodge end).
# Allows buffered input to queue the next action.
class_name PStateRecover
extends State

const DEFAULT_DURATION: float = 0.1  # Safety gap before returning to Idle.

var _timer: float = 0.0

func enter(msg: Dictionary = {}) -> void:
	_timer = msg.get("duration", DEFAULT_DURATION)
	actor.velocity.x = 0.0
	actor.velocity.z = 0.0

func update(delta: float) -> void:
	_timer -= delta
	if _timer <= 0.0:
		# Check buffer for queued action.
		if actor.consume_buffered_action("attack_light"):
			transition_to("Attack")
		elif actor.consume_buffered_action("dodge"):
			if actor.stamina_component.has_stamina(actor.stats.dodge_stamina_cost if actor.stats else 28.0):
				transition_to("Dodge")
			else:
				transition_to("Idle")
		else:
			transition_to("Idle")
