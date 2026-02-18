# hurtbox.gd
# Passive zone that receives damage from Hitboxes.
# Attach as an Area3D child of any actor.
# Set is_invulnerable = true during dodge i-frames.
class_name Hurtbox
extends Area3D

## The actor that owns this hurtbox.
## Set automatically in _ready() from the grandparent (actor root node).
var owner_actor: Node

## When true, Hitbox will skip this hurtbox entirely (i-frames, etc.)
var is_invulnerable: bool = false

func _ready() -> void:
	monitoring = false      # Hurtbox doesn't detect — hitboxes detect it.
	monitorable = true
	# owner_actor is the CharacterBody3D that this hurtbox belongs to.
	# Assumes hierarchy: Actor → Hurtbox (direct child).
	owner_actor = get_parent()

# ---------------------------------------------------------------------------
# I-frame helpers
# ---------------------------------------------------------------------------

func set_invulnerable(value: bool) -> void:
	is_invulnerable = value
	if value:
		SignalBus.iframe_started.emit()
	else:
		SignalBus.iframe_ended.emit()
