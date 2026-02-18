# combat_math.gd
# Pure static math helpers for combat calculations.
# No state, no signals — import anywhere without side effects.
class_name CombatMath
extends Node

## Returns true if `target` is within `dot_threshold` degrees of attacker's forward.
## dot_threshold = 0.0  → anything in the front hemisphere
## dot_threshold = 0.7  → within ~45° cone
static func is_in_front(attacker: Node3D, target: Node3D, dot_threshold: float = 0.0) -> bool:
	var to_target := (target.global_position - attacker.global_position).normalized()
	var facing := -attacker.global_transform.basis.z  # Godot: -Z is forward
	return facing.dot(to_target) > dot_threshold

## Horizontal (XZ) distance between two 3D points, ignoring height.
static func flat_distance(a: Vector3, b: Vector3) -> float:
	var diff := a - b
	diff.y = 0.0
	return diff.length()

## Direction from `from` toward `to` on the XZ plane (normalized).
static func flat_direction(from_pos: Vector3, to_pos: Vector3) -> Vector3:
	var dir := (to_pos - from_pos)
	dir.y = 0.0
	return dir.normalized()

## Applies an instantaneous lunge impulse to a CharacterBody3D's velocity.
static func apply_lunge(body: CharacterBody3D, direction: Vector3, strength: float) -> void:
	body.velocity += direction * strength

## Clamps an angle (degrees) to a -180..180 range.
static func wrap_angle(angle_deg: float) -> float:
	while angle_deg > 180.0:
		angle_deg -= 360.0
	while angle_deg < -180.0:
		angle_deg += 360.0
	return angle_deg

## Linear interpolation helper (kept here for convenience of state scripts).
static func lerp_f(a: float, b: float, t: float) -> float:
	return a + (b - a) * t
