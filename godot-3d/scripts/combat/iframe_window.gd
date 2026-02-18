# iframe_window.gd
# Utility Node that manages a timed invulnerability window on a Hurtbox.
# Usage: create one as a child of any actor that needs temporary i-frames;
#        call start(duration) — it handles set/clear automatically.
# The Dodge state uses the Hurtbox directly for precise frame timing,
# but this node is available for other uses (e.g. revival invuln, parry window).
class_name IframeWindow
extends Node

signal window_started
signal window_ended

var _hurtbox: Hurtbox = null
var _timer: float = 0.0
var _active: bool = false

func _ready() -> void:
	# Look for Hurtbox sibling.
	_hurtbox = get_parent().get_node_or_null("Hurtbox") as Hurtbox

func _process(delta: float) -> void:
	if not _active:
		return
	_timer -= delta
	if _timer <= 0.0:
		_end()

func start(duration: float) -> void:
	_timer = duration
	_active = true
	if _hurtbox:
		_hurtbox.set_invulnerable(true)
	window_started.emit()

func _end() -> void:
	_active = false
	if _hurtbox:
		_hurtbox.set_invulnerable(false)
	window_ended.emit()

func is_active() -> bool:
	return _active
