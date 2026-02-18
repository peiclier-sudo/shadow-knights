# boss_controller.gd
# Root script for the Boss scene.
# Owns the FSM, component refs, and player reference for AI targeting.
class_name BossController
extends ActorBase

@onready var _state_machine: StateMachine = $StateMachine
@onready var _health_component: HealthComponent = $HealthComponent
@onready var _hitbox: Hitbox = $Hitbox
@onready var _hurtbox: Hurtbox = $Hurtbox
@onready var _anim_player: AnimationPlayer = $AnimationPlayer
@onready var _attack_selector: BossAttackSelector = $AttackSelector

## Link set by Main.gd after scene is ready.
var player: PlayerController = null

## Current attack definition being used (set by attack states).
var current_attack_def: AttackDefinition = null

# ---------------------------------------------------------------------------
# Attack definitions loaded from data/ — assigned in scene Inspector.
@export var attack_def_slam: AttackDefinition    # Attack A
@export var attack_def_thrust: AttackDefinition  # Attack B
@export var attack_def_aoe: AttackDefinition     # Attack C

# ---------------------------------------------------------------------------
# Ready
# ---------------------------------------------------------------------------

func _ready() -> void:
	health_component = _health_component
	hitbox = _hitbox
	hurtbox = _hurtbox

	if stats:
		_health_component.max_hp = stats.max_hp

	_health_component.died.connect(_on_died)
	_health_component.hp_changed.connect(func(hp, max_hp):
		SignalBus.boss_damaged.emit(max_hp - hp, hp, max_hp)
	)

	_state_machine.initialize(self)

	# Pass self to attack selector.
	_attack_selector.boss = self

	add_to_group("boss")

# ---------------------------------------------------------------------------
# Player targeting
# ---------------------------------------------------------------------------

func get_player() -> PlayerController:
	if player:
		return player
	# Fallback: find via group.
	var players := get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		player = players[0] as PlayerController
	return player

func distance_to_player() -> float:
	var p := get_player()
	if not p:
		return INF
	return CombatMath.flat_distance(global_position, p.global_position)

func direction_to_player() -> Vector3:
	var p := get_player()
	if not p:
		return Vector3.ZERO
	return CombatMath.flat_direction(global_position, p.global_position)

# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

func _on_died() -> void:
	_state_machine.transition_to("Recover", {"lethal": true})
	SignalBus.boss_died.emit()
