# b_chase.gd  —  Boss FSM: Chase
# Moves the boss toward the player at walk speed.
# Asks AttackSelector when to launch an attack.
# Attack range: when within 2.5 m of player.
class_name BStateChase
extends State

const ATTACK_RANGE: float = 2.5
const MOVE_SPEED: float = 3.0

func enter(_msg: Dictionary = {}) -> void:
	if actor.has_node("AnimationPlayer"):
		actor.get_node("AnimationPlayer").play("walk")

func physics_update(delta: float) -> void:
	var boss := actor as BossController
	if not boss:
		return

	var dist := boss.distance_to_player()
	var dir := boss.direction_to_player()

	# Rotate to face player.
	if dir.length_squared() > 0.001:
		boss.face_toward(boss.global_position + dir, 6.0, delta)

	# Within attack range — try to select an attack.
	if dist <= ATTACK_RANGE:
		var next_attack := boss._attack_selector.pick_attack()
		if not next_attack.is_empty():
			transition_to(next_attack)
			return
		# Attack on cooldown — stay still and wait.
		actor.velocity.x = 0.0
		actor.velocity.z = 0.0
		return

	# Move toward player.
	actor.velocity.x = dir.x * MOVE_SPEED
	actor.velocity.z = dir.z * MOVE_SPEED
