# lockon_indicator.gd
# Positions a small UI widget (reticle / bracket) over the locked target.
# Attach to a Control node inside CombatHUD.
class_name LockOnIndicator
extends Control

@export var indicator_color: Color = Color(0.2, 1.0, 0.8)
@export var bracket_size: float = 32.0

var _lock_target: LockOnTarget = null
var _camera: Camera3D = null
var _visible_indicator: bool = false

func _ready() -> void:
	visible = false
	SignalBus.lockon_acquired.connect(_on_lockon_acquired)
	SignalBus.lockon_released.connect(_on_lockon_released)

	call_deferred("_find_camera")

func _find_camera() -> void:
	_camera = get_viewport().get_camera_3d()

func _process(_delta: float) -> void:
	if not _visible_indicator or not _lock_target or not _camera:
		return
	if not is_instance_valid(_lock_target):
		_on_lockon_released()
		return

	var world_pos := _lock_target.global_position
	var screen_pos := _camera.unproject_position(world_pos)

	# Hide when target is behind camera.
	if _camera.is_position_behind(world_pos):
		visible = false
		return

	visible = true
	position = screen_pos - Vector2(bracket_size * 0.5, bracket_size * 0.5)

func _draw() -> void:
	if not _visible_indicator:
		return
	# Draw corner brackets.
	var s := bracket_size
	var t := 6.0  # Thickness of bracket arms.
	var c := indicator_color
	# Top-left
	draw_line(Vector2(0, 0), Vector2(t, 0), c, 2.0)
	draw_line(Vector2(0, 0), Vector2(0, t), c, 2.0)
	# Top-right
	draw_line(Vector2(s, 0), Vector2(s - t, 0), c, 2.0)
	draw_line(Vector2(s, 0), Vector2(s, t), c, 2.0)
	# Bottom-left
	draw_line(Vector2(0, s), Vector2(t, s), c, 2.0)
	draw_line(Vector2(0, s), Vector2(0, s - t), c, 2.0)
	# Bottom-right
	draw_line(Vector2(s, s), Vector2(s - t, s), c, 2.0)
	draw_line(Vector2(s, s), Vector2(s, s - t), c, 2.0)

func _on_lockon_acquired(target: Node3D) -> void:
	_lock_target = target as LockOnTarget
	_visible_indicator = true
	visible = true
	queue_redraw()

func _on_lockon_released() -> void:
	_lock_target = null
	_visible_indicator = false
	visible = false
	queue_redraw()
