# health_component.gd
# Tracks hit points for any actor (player or boss).
# Attach as a child node; connect signals for UI and game-loop reactions.
class_name HealthComponent
extends Node

signal hp_changed(new_hp: float, max_hp: float)
signal died

@export var max_hp: float = 100.0

var current_hp: float

func _ready() -> void:
	current_hp = max_hp

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

## Apply damage. Returns the actual amount of HP removed (capped at current_hp).
## Emits hp_changed and (if lethal) died.
func take_damage(amount: float) -> float:
	if current_hp <= 0.0:
		return 0.0
	amount = maxf(amount, 0.0)
	var actual := minf(amount, current_hp)
	current_hp -= actual
	hp_changed.emit(current_hp, max_hp)
	if current_hp <= 0.0:
		died.emit()
	return actual

## Heal up to max_hp. Returns actual amount healed.
func heal(amount: float) -> float:
	if current_hp >= max_hp:
		return 0.0
	var actual := minf(amount, max_hp - current_hp)
	current_hp += actual
	hp_changed.emit(current_hp, max_hp)
	return actual

func is_dead() -> bool:
	return current_hp <= 0.0

func get_hp_ratio() -> float:
	return current_hp / max_hp if max_hp > 0.0 else 0.0
