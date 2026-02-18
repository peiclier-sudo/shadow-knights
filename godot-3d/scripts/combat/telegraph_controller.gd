# telegraph_controller.gd
# Listens to SignalBus boss telegraph events and drives visual feedback.
# Attach to any node in the scene (e.g. Arena_01 or CombatHUD).
#
# In the vertical slice this provides:
#   - Boss mesh color change during telegraph.
#   - HUD warning label or panel flash.
# VFX particles are added later without touching combat logic.
class_name TelegraphController
extends Node

## Reference to the boss mesh — set by Main.gd after scene ready.
var boss_mesh: MeshInstance3D = null

## Material used for telegraph color tinting.
var _base_color: Color = Color.WHITE
var _tint_material: StandardMaterial3D = null

const TELEGRAPH_COLORS: Dictionary = {
	"slam":   Color(1.0, 0.6, 0.1),   # Orange
	"thrust": Color(0.8, 0.2, 1.0),   # Purple
	"aoe":    Color(1.0, 0.1, 0.1),   # Red
}

func _ready() -> void:
	SignalBus.boss_attack_telegraphed.connect(_on_telegraphed)
	SignalBus.boss_attack_ended.connect(_on_ended)

func _on_telegraphed(attack_id: String, _duration: float) -> void:
	if not boss_mesh:
		boss_mesh = _find_boss_mesh()
	if not boss_mesh:
		return

	var color := TELEGRAPH_COLORS.get(attack_id, Color.WHITE)
	_apply_tint(color)

func _on_ended(_attack_id: String) -> void:
	_restore_tint()

func _apply_tint(color: Color) -> void:
	var mat := boss_mesh.get_active_material(0)
	if mat is StandardMaterial3D:
		_base_color = mat.albedo_color
		mat.albedo_color = color
		mat.emission_enabled = true
		mat.emission = color * 0.4

func _restore_tint() -> void:
	var mat := boss_mesh.get_active_material(0) if boss_mesh else null
	if mat is StandardMaterial3D:
		mat.albedo_color = _base_color
		mat.emission_enabled = false

func _find_boss_mesh() -> MeshInstance3D:
	var bosses := get_tree().get_nodes_in_group("boss")
	for b in bosses:
		var mesh := b.get_node_or_null("MeshInstance3D") as MeshInstance3D
		if mesh:
			return mesh
	return null
