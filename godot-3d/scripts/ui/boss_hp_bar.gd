# boss_hp_bar.gd
# Drives the boss HealthComponent → ProgressBar in CombatHUD.
# Animates a "damage delay" bar for readability (white bar lingers briefly).
class_name BossHPBar
extends ProgressBar

@export var color_hp: Color = Color(0.9, 0.2, 0.2)
@export var color_delay: Color = Color(1.0, 1.0, 1.0, 0.7)

## Delay bar speed — how fast the lag bar catches up to real HP.
@export var delay_drain_speed: float = 0.8

var _delay_bar: ProgressBar = null
var _target_ratio: float = 1.0

func _ready() -> void:
	min_value = 0.0
	max_value = 1.0
	value = 1.0

	# Create a sibling ProgressBar for the delay effect.
	_delay_bar = ProgressBar.new()
	_delay_bar.min_value = 0.0
	_delay_bar.max_value = 1.0
	_delay_bar.value = 1.0
	_delay_bar.show_percentage = false
	_delay_bar.size_flags_horizontal = size_flags_horizontal
	_delay_bar.size_flags_vertical = size_flags_vertical
	_delay_bar.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	get_parent().add_child(_delay_bar)
	get_parent().move_child(_delay_bar, get_index())  # Place behind HP bar.

	call_deferred("_connect_to_boss")

func _process(delta: float) -> void:
	if _delay_bar and _delay_bar.value > value:
		_delay_bar.value = lerpf(_delay_bar.value, _target_ratio, delay_drain_speed * delta)

func _connect_to_boss() -> void:
	var bosses := get_tree().get_nodes_in_group("boss")
	if bosses.is_empty():
		await get_tree().process_frame
		_connect_to_boss()
		return
	var boss := bosses[0] as BossController
	if boss and boss.has_node("HealthComponent"):
		var hc := boss.get_node("HealthComponent") as HealthComponent
		hc.hp_changed.connect(_on_hp_changed)
		value = hc.get_hp_ratio()
		if _delay_bar:
			_delay_bar.value = value

func _on_hp_changed(new_hp: float, max_hp: float) -> void:
	_target_ratio = new_hp / max_hp if max_hp > 0.0 else 0.0
	value = _target_ratio  # HP bar snaps immediately.
	# Delay bar drains in _process.
