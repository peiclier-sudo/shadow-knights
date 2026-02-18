# actor_base.gd
# Shared base for PlayerController and BossController.
# Provides gravity, move_and_slide, and component references.
class_name ActorBase
extends CharacterBody3D

## Assign an ActorStats resource in the inspector.
@export var stats: ActorStats

# Component references — set by _ready() in subclasses via @onready.
var health_component: HealthComponent
var stamina_component: StaminaComponent
var hitbox: Hitbox
var hurtbox: Hurtbox

const GRAVITY: float = 20.0

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= GRAVITY * delta
	move_and_slide()

# ---------------------------------------------------------------------------
# Convenience helpers
# ---------------------------------------------------------------------------

## Face toward a world-space XZ position (keeps Y rotation only).
func face_toward(world_pos: Vector3, speed: float = 10.0, delta: float = 0.016) -> void:
	var dir := CombatMath.flat_direction(global_position, world_pos)
	if dir.length_squared() < 0.001:
		return
	var target_basis := Basis.looking_at(dir, Vector3.UP)
	global_transform.basis = global_transform.basis.slerp(target_basis, speed * delta)

## Immediate hard face (no smoothing, used at state entry).
func face_toward_instant(world_pos: Vector3) -> void:
	var dir := CombatMath.flat_direction(global_position, world_pos)
	if dir.length_squared() < 0.001:
		return
	global_transform.basis = Basis.looking_at(dir, Vector3.UP)
