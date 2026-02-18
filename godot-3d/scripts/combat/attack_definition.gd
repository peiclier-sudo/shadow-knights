# attack_definition.gd
# Data resource defining every tunable parameter for one attack.
# Create instances as .tres files under data/attacks/.
# All timing values in seconds. Distances in metres.
class_name AttackDefinition
extends Resource

# ---------------------------------------------------------------------------
# Damage
# ---------------------------------------------------------------------------

@export var damage: float = 25.0

# ---------------------------------------------------------------------------
# Timing windows  (from tuning table in plan)
# ---------------------------------------------------------------------------

@export var startup_s: float = 0.18
@export var active_s: float  = 0.10
@export var recovery_s: float = 0.32

# ---------------------------------------------------------------------------
# Movement
# ---------------------------------------------------------------------------

## Forward velocity impulse applied at the start of the active window.
@export var forward_lunge_m: float = 0.0

## Knockback applied to the victim (m/s).
@export var knockback_strength: float = 3.0

# ---------------------------------------------------------------------------
# Hitstop (freeze-frame on impact)
# ---------------------------------------------------------------------------

@export var hitstop_attacker_s: float = 0.035
@export var hitstop_victim_s: float   = 0.055

# ---------------------------------------------------------------------------
# Camera
# ---------------------------------------------------------------------------

@export var camera_impulse_strength: float = 0.3

# ---------------------------------------------------------------------------
# Hitbox shape (used at runtime to resize the CollisionShape3D)
# ---------------------------------------------------------------------------

@export var hitbox_radius: float = 0.6
@export var hitbox_offset: Vector3 = Vector3(0.0, 0.5, -0.8)

# ---------------------------------------------------------------------------
# Telegraph (boss attacks only; 0 = no telegraph)
# ---------------------------------------------------------------------------

@export var telegraph_duration: float = 0.0
## Short string ID for HUD / VFX lookup: "slam", "thrust", "aoe"
@export var attack_id: String = ""

# ---------------------------------------------------------------------------
# Stamina cost (player attacks)
# ---------------------------------------------------------------------------

@export var stamina_cost: float = 0.0
