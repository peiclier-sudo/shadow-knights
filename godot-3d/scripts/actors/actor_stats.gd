# actor_stats.gd
# Data resource for actor tuning. Create instances as .tres files.
# All tuning values from the plan's combat-feel table.
class_name ActorStats
extends Resource

# ---------------------------------------------------------------------------
# Health / Stamina
# ---------------------------------------------------------------------------

@export var max_hp: float = 100.0
@export var max_stamina: float = 100.0
@export var stamina_regen_rate: float = 22.0   # points / second
@export var stamina_regen_delay: float = 0.75  # seconds after last spend

# ---------------------------------------------------------------------------
# Movement
# ---------------------------------------------------------------------------

@export var move_speed: float = 5.0   # m/s

# ---------------------------------------------------------------------------
# Dodge  (plan tuning)
# ---------------------------------------------------------------------------

@export var dodge_distance: float = 4.2       # metres
@export var dodge_duration: float = 0.56      # seconds total
@export var dodge_iframe_start: float = 0.067 # seconds into dodge (frame 4 @ 60fps)
@export var dodge_iframe_end: float   = 0.283 # seconds into dodge (frame 17 @ 60fps)
@export var dodge_stamina_cost: float = 28.0  # stamina points per dodge
