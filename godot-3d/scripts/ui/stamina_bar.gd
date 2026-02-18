# stamina_bar.gd
# Drives the player stamina ProgressBar in CombatHUD.
# Listens to stamina_changed signal from the player's StaminaComponent.
class_name StaminaBar
extends ProgressBar

## Color when stamina is above 60%.
@export var color_full: Color = Color(0.2, 0.8, 1.0)
## Color when stamina is below 30% (warning).
@export var color_low: Color = Color(1.0, 0.5, 0.1)

func _ready() -> void:
	min_value = 0.0
	max_value = 1.0
	value = 1.0
	_update_color(1.0)

	# Connect after the player is in the tree.
	call_deferred("_connect_to_player")

func _connect_to_player() -> void:
	var players := get_tree().get_nodes_in_group("player")
	if players.is_empty():
		# Retry next frame.
		await get_tree().process_frame
		_connect_to_player()
		return
	var player := players[0] as PlayerController
	if player and player.has_node("StaminaComponent"):
		var sc := player.get_node("StaminaComponent") as StaminaComponent
		sc.stamina_changed.connect(_on_stamina_changed)
		value = sc.get_ratio()
		_update_color(value)

func _on_stamina_changed(new_stamina: float, max_stamina: float) -> void:
	var ratio := new_stamina / max_stamina if max_stamina > 0.0 else 0.0
	value = ratio
	_update_color(ratio)

func _update_color(ratio: float) -> void:
	var style := get_theme_stylebox("fill") as StyleBoxFlat
	if not style:
		return
	style.bg_color = color_full.lerp(color_low, 1.0 - ratio) if ratio < 0.6 else color_full
