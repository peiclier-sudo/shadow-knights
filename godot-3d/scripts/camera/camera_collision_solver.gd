# camera_collision_solver.gd
# SpringArm3D handles camera collision natively in Godot 4.
# This script provides additional configuration and debug helpers
# for the SpringArm that can't be set purely in the Inspector.
#
# Attach to the SpringArm3D node inside CombatCameraRig.
class_name CameraCollisionSolver
extends SpringArm3D

## Minimum arm length when fully occluded (prevents clipping into geometry).
@export var min_arm_length: float = 1.5
## Default (maximum) arm length from CameraProfile.
@export var max_arm_length: float = 5.0

## How quickly the arm extends back after an obstruction clears.
@export var extend_speed: float = 8.0

var _target_length: float = 0.0

func _ready() -> void:
	_target_length = max_arm_length
	spring_length = max_arm_length
	# Exclude the player from arm collision.
	var players := get_tree().get_nodes_in_group("player")
	for p in players:
		add_excluded_object(p.get_rid())

func _physics_process(delta: float) -> void:
	# Smoothly restore arm length when unoccluded.
	# SpringArm auto-shortens on collision; we just need to restore.
	spring_length = lerpf(spring_length, _target_length, extend_speed * delta)

func set_max_length(length: float) -> void:
	_target_length = clampf(length, min_arm_length, max_arm_length)
