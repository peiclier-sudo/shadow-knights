# hitbox.gd
# Active collision zone that deals damage to overlapping Hurtboxes.
# Attach as an Area3D child of any actor.
# Call activate() to arm it; deactivate() after the active window ends.
class_name Hitbox
extends Area3D

signal hit_confirmed(hurtbox: Hurtbox)

## The actor node that owns this hitbox (set automatically in _ready).
var owner_actor: Node

## The current attack data; must be set before activate().
var attack_def: AttackDefinition

var _active: bool = false

# Tracks already-hit targets in this active window to prevent multi-hit.
var _hit_set: Array[Node] = []

# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

func _ready() -> void:
	monitoring = false
	monitorable = false
	# Hitbox never needs to be detected by others — it detects hurtboxes.
	area_entered.connect(_on_area_entered)

# ---------------------------------------------------------------------------
# Activation
# ---------------------------------------------------------------------------

func activate(p_owner: Node, p_attack_def: AttackDefinition) -> void:
	owner_actor = p_owner
	attack_def = p_attack_def
	_hit_set.clear()
	monitoring = true
	_active = true

func deactivate() -> void:
	monitoring = false
	_active = false
	attack_def = null

# ---------------------------------------------------------------------------
# Overlap handling
# ---------------------------------------------------------------------------

func _on_area_entered(area: Area3D) -> void:
	if not _active or attack_def == null:
		return
	if not area is Hurtbox:
		return

	var hurtbox := area as Hurtbox

	# Skip: same team
	if hurtbox.owner_actor != null and hurtbox.owner_actor == owner_actor:
		return

	# Skip: i-frame active on victim
	if hurtbox.is_invulnerable:
		return

	# Skip: already hit this actor in this active window
	if hurtbox.owner_actor != null and _hit_set.has(hurtbox.owner_actor):
		return

	_hit_set.append(hurtbox.owner_actor)
	hit_confirmed.emit(hurtbox)
	# Actual damage + hitstop is applied by HitResolver autoload.
	HitResolver.resolve(owner_actor, hurtbox, attack_def)
