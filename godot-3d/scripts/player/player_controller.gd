# player_controller.gd
# Root script for the Player scene (CharacterBody3D).
# Owns the FSM, component refs, and camera reference for movement projection.
class_name PlayerController
extends ActorBase

# ---------------------------------------------------------------------------
# Child references (assigned in scene, verified in _ready)
# ---------------------------------------------------------------------------

@onready var _state_machine: StateMachine = $StateMachine
@onready var _health_component: HealthComponent = $HealthComponent
@onready var _stamina_component: StaminaComponent = $StaminaComponent
@onready var _hitbox: Hitbox = $Hitbox
@onready var _hurtbox: Hurtbox = $Hurtbox
@onready var _anim_player: AnimationPlayer = $AnimationPlayer

## Loaded from data/actors/player_stats.tres via @export in scene.
## stats is defined in ActorBase.

## Injected by Main.gd after scene is ready.
var camera_rig: Node3D = null

# Input buffer window in seconds (from plan: 60–100 ms).
const INPUT_BUFFER_DURATION: float = 0.083

var _buffered_action: String = ""
var _buffer_timer: float = 0.0

# ---------------------------------------------------------------------------
# Ready
# ---------------------------------------------------------------------------

func _ready() -> void:
	# Propagate component refs to the base class.
	health_component = _health_component
	stamina_component = _stamina_component
	hitbox = _hitbox
	hurtbox = _hurtbox

	# Apply stats from resource.
	if stats:
		_health_component.max_hp = stats.max_hp
		_stamina_component.max_stamina = stats.max_stamina
		_stamina_component.regen_rate = stats.stamina_regen_rate
		_stamina_component.regen_delay = stats.stamina_regen_delay

	# Wire death signal.
	_health_component.died.connect(_on_died)

	# Wire HP/stamina changes to SignalBus for UI.
	_health_component.hp_changed.connect(func(hp, max_hp):
		SignalBus.player_damaged.emit(max_hp - hp, hp, max_hp)
	)

	# Start FSM.
	_state_machine.initialize(self)

	add_to_group("player")

# ---------------------------------------------------------------------------
# Input buffering
# ---------------------------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	# Buffer attack and dodge presses for 83 ms.
	if event.is_action_pressed("attack_light"):
		_buffer_action("attack_light")
	elif event.is_action_pressed("dodge"):
		_buffer_action("dodge")

	_state_machine._unhandled_input(event)

func _buffer_action(action: String) -> void:
	_buffered_action = action
	_buffer_timer = INPUT_BUFFER_DURATION

func consume_buffered_action(action: String) -> bool:
	if _buffered_action == action and _buffer_timer > 0.0:
		_buffered_action = ""
		_buffer_timer = 0.0
		return true
	return false

func _process(delta: float) -> void:
	if _buffer_timer > 0.0:
		_buffer_timer -= delta
		if _buffer_timer <= 0.0:
			_buffered_action = ""

# ---------------------------------------------------------------------------
# Movement helpers (called by states)
# ---------------------------------------------------------------------------

## Returns a camera-relative movement direction from WASD input (XZ plane).
func get_move_direction() -> Vector3:
	var raw := Vector2(
		Input.get_axis("move_left", "move_right"),
		Input.get_axis("move_forward", "move_back")
	)
	if raw.length_squared() < 0.01:
		return Vector3.ZERO

	if camera_rig:
		var cam_basis := camera_rig.global_transform.basis
		var forward := -cam_basis.z
		var right := cam_basis.x
		forward.y = 0.0
		right.y = 0.0
		return (right * raw.x + forward * raw.y).normalized()

	return Vector3(raw.x, 0.0, raw.y).normalized()

## Returns the last non-zero move direction (for dodge direction).
func get_dodge_direction() -> Vector3:
	var dir := get_move_direction()
	if dir.length_squared() < 0.01:
		# Dodge backward if no directional input.
		return -global_transform.basis.z
	return dir

# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

func _on_died() -> void:
	_state_machine.transition_to("Hitstun", {"lethal": true})
	SignalBus.player_died.emit()
