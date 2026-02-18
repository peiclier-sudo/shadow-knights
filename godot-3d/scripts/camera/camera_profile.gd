# camera_profile.gd
# Data resource for lock-on camera tuning.
# Create a .tres instance and assign it to CombatCameraRig in the inspector.
class_name CameraProfile
extends Resource

# ---------------------------------------------------------------------------
# Lock-on distance (from plan tuning table)
# ---------------------------------------------------------------------------

@export var arm_length: float = 5.0            # SpringArm default length (metres)
@export var max_lock_distance: float = 18.0    # Maximum acquisition distance
@export var break_distance: float = 22.0       # Distance to drop lock-on
@export var los_grace_s: float = 0.25          # Seconds before LOS break drops lock

# ---------------------------------------------------------------------------
# Smoothing (from plan tuning table)
# ---------------------------------------------------------------------------

@export var follow_smoothing: float = 10.0     # Position lerp speed
@export var recenter_speed: float = 7.0        # Yaw recentering speed when locked

# ---------------------------------------------------------------------------
# Pitch limits (degrees, negative = looking down)
# ---------------------------------------------------------------------------

@export var pitch_min: float = -20.0
@export var pitch_max: float = 40.0
