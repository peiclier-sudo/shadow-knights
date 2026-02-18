# lockon_target.gd
# Marker3D placed on an actor's body center (or chest height).
# The camera controller queries all nodes in the "lockon_targets" group.
class_name LockOnTarget
extends Marker3D

## Set false to temporarily disable acquisition (e.g. boss intro cutscene).
@export var is_lockable: bool = true

func _ready() -> void:
	add_to_group("lockon_targets")
