# state.gd
# Base class for all FSM states (player and boss share this).
# Subclass this and override the virtual methods you need.
class_name State
extends Node

## Back-reference set by StateMachine.initialize()
var state_machine: StateMachine

## The actor (PlayerController or BossController) that owns this state.
## Set by StateMachine.initialize() after the actor is ready.
var actor: Node

# ---------------------------------------------------------------------------
# Virtual interface
# ---------------------------------------------------------------------------

## Called once when entering this state.
## msg carries optional data from the previous state (e.g. hit direction).
func enter(_msg: Dictionary = {}) -> void:
	pass

## Called once when leaving this state.
func exit() -> void:
	pass

## Called every frame (non-physics).
func update(_delta: float) -> void:
	pass

## Called every physics tick.
func physics_update(_delta: float) -> void:
	pass

## Called for unhandled input events.
func handle_input(_event: InputEvent) -> void:
	pass

# ---------------------------------------------------------------------------
# Convenience helpers
# ---------------------------------------------------------------------------

func transition_to(state_name: String, msg: Dictionary = {}) -> void:
	state_machine.transition_to(state_name, msg)
