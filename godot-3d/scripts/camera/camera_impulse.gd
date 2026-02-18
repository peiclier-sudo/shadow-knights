# camera_impulse.gd
# Applies a brief screen-shake / camera kick on heavy hits.
# Attach to the Camera3D node. Call trigger(strength) on hit events.
#
# Strength is a float; plan values:
#   Light hit : 0.3
#   Heavy hit : 0.6
class_name CameraImpulse
extends Node

## Maximum offset in metres at strength = 1.0
@export var max_offset: float = 0.12
## How quickly the shake decays (higher = faster settle).
@export var decay_speed: float = 18.0

var _shake_strength: float = 0.0
var _camera: Camera3D = null
var _origin_offset: Vector3 = Vector3.ZERO

func _ready() -> void:
	_camera = get_parent() as Camera3D
	if _camera:
		_origin_offset = _camera.position

func _process(delta: float) -> void:
	if _shake_strength <= 0.001:
		if _camera:
			_camera.position = _origin_offset
		return

	# Apply random offset.
	var rx := randf_range(-1.0, 1.0) * _shake_strength * max_offset
	var ry := randf_range(-1.0, 1.0) * _shake_strength * max_offset
	if _camera:
		_camera.position = _origin_offset + Vector3(rx, ry, 0.0)

	# Decay.
	_shake_strength = maxf(0.0, _shake_strength - decay_speed * delta)

## Call this from HitResolver or SignalBus listener.
func trigger(strength: float) -> void:
	_shake_strength = clampf(strength, 0.0, 1.0)
