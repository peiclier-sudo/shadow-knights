# stamina_component.gd
# Tracks stamina with spend/regen logic.
# Regen is delayed after any spend — tuning values come from ActorStats.tres.
class_name StaminaComponent
extends Node

signal stamina_changed(new_stamina: float, max_stamina: float)
signal stamina_depleted
signal regen_resumed

# --- Tuning (overridden from ActorStats in actor _ready) ---
@export var max_stamina: float = 100.0
@export var regen_rate: float = 22.0   # points per second
@export var regen_delay: float = 0.75  # seconds before regen kicks in after a spend

var current_stamina: float
var _regen_timer: float = 0.0
var _regen_blocked: bool = false

func _ready() -> void:
	current_stamina = max_stamina

# ---------------------------------------------------------------------------
# Tick
# ---------------------------------------------------------------------------

func _process(delta: float) -> void:
	# Tick down regen delay.
	if _regen_blocked:
		_regen_timer -= delta
		if _regen_timer <= 0.0:
			_regen_blocked = false
			regen_resumed.emit()

	# Regenerate.
	if not _regen_blocked and current_stamina < max_stamina:
		current_stamina = minf(max_stamina, current_stamina + regen_rate * delta)
		stamina_changed.emit(current_stamina, max_stamina)

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

## Attempt to spend `amount` stamina.
## Returns true if successful; false if insufficient stamina.
func spend(amount: float) -> bool:
	if current_stamina < amount:
		return false
	current_stamina -= amount
	_regen_blocked = true
	_regen_timer = regen_delay
	stamina_changed.emit(current_stamina, max_stamina)
	if current_stamina <= 0.0:
		stamina_depleted.emit()
	return true

## Returns true if at least `amount` stamina is available.
func has_stamina(amount: float) -> bool:
	return current_stamina >= amount

func get_ratio() -> float:
	return current_stamina / max_stamina if max_stamina > 0.0 else 0.0
