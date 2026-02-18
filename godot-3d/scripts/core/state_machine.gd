# state_machine.gd
# Generic Finite State Machine used by both PlayerController and BossController.
# Attach as a child node; call initialize(actor) after _ready.
class_name StateMachine
extends Node

signal state_changed(new_state_name: String)

## Name of the state to enter on initialization.
@export var initial_state_name: String = "Idle"

var current_state: State
var states: Dictionary = {}

# Set externally by the owning actor before calling initialize().
var actor: Node

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

func _ready() -> void:
	# Collect all direct child States into the lookup dictionary.
	for child in get_children():
		if child is State:
			states[child.name] = child
			child.state_machine = self

func initialize(p_actor: Node) -> void:
	actor = p_actor
	for state in states.values():
		state.actor = actor

	if states.has(initial_state_name):
		current_state = states[initial_state_name]
		current_state.enter()
		state_changed.emit(initial_state_name)
	else:
		push_error("StateMachine: initial state '%s' not found." % initial_state_name)

# ---------------------------------------------------------------------------
# Transition
# ---------------------------------------------------------------------------

func transition_to(state_name: String, msg: Dictionary = {}) -> void:
	if not states.has(state_name):
		push_warning("StateMachine: unknown state '%s'" % state_name)
		return
	if current_state:
		current_state.exit()
	current_state = states[state_name]
	current_state.enter(msg)
	state_changed.emit(state_name)

# ---------------------------------------------------------------------------
# Tick forwarding
# ---------------------------------------------------------------------------

func _process(delta: float) -> void:
	if current_state:
		current_state.update(delta)

func _physics_process(delta: float) -> void:
	if current_state:
		current_state.physics_update(delta)

func _unhandled_input(event: InputEvent) -> void:
	if current_state:
		current_state.handle_input(event)

# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

func is_in_state(state_name: String) -> bool:
	return current_state != null and current_state.name == state_name

func current_state_name() -> String:
	return current_state.name if current_state else ""
