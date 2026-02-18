# hitstop_controller.gd
# Autoload singleton: HitstopController
# Implements "freeze-frame" hitstop by briefly setting Engine.time_scale to near-zero.
#
# Godot 4 note: Engine.time_scale affects _process and _physics_process uniformly.
# Timers and anything using PROCESS_MODE_ALWAYS are unaffected.
# We use that to restore scale after the hitstop duration elapses.
#
# Tuning (from plan):
#   Light hit : attacker 0.035 s / victim 0.055 s  → use victim (longer)
#   Heavy hit : attacker 0.045 s / victim 0.075 s  → use victim (longer)
extends Node

const HITSTOP_SCALE: float = 0.05   # Not zero — avoids physics lock-up.
const NORMAL_SCALE: float  = 1.0

var _active: bool = false
var _restore_timer: Timer

func _ready() -> void:
	_restore_timer = Timer.new()
	_restore_timer.one_shot = true
	# Must run even when time_scale = 0 → ALWAYS mode.
	_restore_timer.process_callback = Timer.TIMER_PROCESS_IDLE
	_restore_timer.timeout.connect(_restore)
	add_child(_restore_timer)
	_restore_timer.process_mode = Node.PROCESS_MODE_ALWAYS

## Call with both durations; uses the longer one (victim feels the weight most).
func request_hitstop(attacker_dur: float, victim_dur: float) -> void:
	var duration := maxf(attacker_dur, victim_dur)
	if duration <= 0.0:
		return
	# If a longer hitstop is already running, don't interrupt.
	if _active and _restore_timer.time_left > duration:
		return
	_start(duration)

func _start(duration: float) -> void:
	_active = true
	Engine.time_scale = HITSTOP_SCALE
	_restore_timer.start(duration)   # Runs in real time (PROCESS_MODE_ALWAYS).

func _restore() -> void:
	Engine.time_scale = NORMAL_SCALE
	_active = false
