# hit_resolver.gd
# Autoload singleton: HitResolver
# Central authority for processing a confirmed hit.
# Called by Hitbox when overlap is validated.
#
# Responsibilities:
#   1. Apply damage to victim's HealthComponent.
#   2. Apply knockback direction.
#   3. Request hitstop.
#   4. Trigger camera impulse.
#   5. Emit SignalBus.hit_landed.
#   6. Transition victim to hitstun FSM state.
extends Node

func resolve(attacker: Node, hurtbox: Hurtbox, attack_def: AttackDefinition) -> void:
	if attack_def == null:
		push_warning("HitResolver.resolve: attack_def is null")
		return

	var victim := hurtbox.owner_actor

	# --- 1. Damage ---
	var health: HealthComponent = null
	if victim and victim.has_node("HealthComponent"):
		health = victim.get_node("HealthComponent") as HealthComponent
	var actual_dmg := 0.0
	if health and not health.is_dead():
		actual_dmg = health.take_damage(attack_def.damage)

	# --- 2. Knockback ---
	var knockback_dir := Vector3.ZERO
	if attacker is Node3D and victim is Node3D:
		knockback_dir = CombatMath.flat_direction(
			(attacker as Node3D).global_position,
			(victim as Node3D).global_position
		)

	# --- 3. Hitstop ---
	HitstopController.request_hitstop(
		attack_def.hitstop_attacker_s,
		attack_def.hitstop_victim_s
	)

	# --- 4. Camera impulse ---
	_trigger_camera_impulse(attack_def.camera_impulse_strength)

	# --- 5. Signal ---
	SignalBus.hit_landed.emit(attacker, victim, attack_def, actual_dmg)

	# --- 6. Victim FSM transition ---
	if victim and victim.has_node("StateMachine") and not health.is_dead():
		var fsm := victim.get_node("StateMachine") as StateMachine
		if fsm:
			fsm.transition_to("Hitstun", {
				"knockback_dir": knockback_dir,
				"knockback_strength": attack_def.knockback_strength,
				"duration": 0.35,
			})

func _trigger_camera_impulse(strength: float) -> void:
	# Find camera rig in scene (faster than group lookup after first call).
	var cam_rigs := get_tree().get_nodes_in_group("camera_rig")
	for rig in cam_rigs:
		if rig.has_method("apply_impulse"):
			rig.apply_impulse(strength)
