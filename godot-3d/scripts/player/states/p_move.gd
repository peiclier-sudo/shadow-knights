# p_move.gd  —  Player FSM: Move
# Handles camera-relative WASD locomotion.
# Exits to: Idle (no input), Attack, Dodge.
class_name PStateMove
extends State

var _move_speed: float = 5.0

func enter(_msg: Dictionary = {}) -> void:
	_move_speed = actor.stats.move_speed if actor.stats else 5.0
	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("walk")

func physics_update(delta: float) -> void:
	var dir := actor.get_move_direction()

	if dir.length_squared() < 0.01:
		transition_to("Idle")
		return

	# Check buffered actions first (attack/dodge mid-move).
	if actor.consume_buffered_action("attack_light"):
		transition_to("Attack")
		return

	if actor.consume_buffered_action("dodge"):
		if actor.stamina_component.has_stamina(actor.stats.dodge_stamina_cost if actor.stats else 28.0):
			transition_to("Dodge")
		return

	# Apply lateral velocity (gravity handled by ActorBase._physics_process).
	actor.velocity.x = dir.x * _move_speed
	actor.velocity.z = dir.z * _move_speed

	# Smoothly rotate the character to face movement direction.
	# Skip if locked on (camera handles facing).
	var cam := actor.camera_rig
	var locked := cam != null and cam.has_method("is_locked_on") and cam.is_locked_on()
	if not locked:
		actor.face_toward(actor.global_position + dir, 12.0, delta)
