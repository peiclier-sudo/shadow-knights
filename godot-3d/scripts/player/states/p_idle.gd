# p_idle.gd  —  Player FSM: Idle
# Entered when the player has no input and is grounded.
# Exits to: Move, Attack, Dodge.
class_name PStateIdle
extends State

func enter(_msg: Dictionary = {}) -> void:
	# Stop lateral movement; preserve vertical (gravity).
	actor.velocity.x = 0.0
	actor.velocity.z = 0.0
	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("idle")

func physics_update(_delta: float) -> void:
	# Transition to Move when directional input is detected.
	if actor.get_move_direction().length_squared() > 0.01:
		transition_to("Move")
		return

	# Check input buffer for attack.
	if actor.consume_buffered_action("attack_light"):
		transition_to("Attack")
		return

	# Check input buffer for dodge.
	if actor.consume_buffered_action("dodge"):
		if actor.stamina_component.has_stamina(actor.stats.dodge_stamina_cost if actor.stats else 28.0):
			transition_to("Dodge")
		return
