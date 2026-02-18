# game_loop.gd
# Autoload singleton: GameLoop
# Manages high-level game state: FIGHTING → PLAYER_DEAD or BOSS_DEAD → restart.
# Restart must happen within 5 s of death (validation gate requirement).
extends Node

enum GameState {
	FIGHTING,
	PLAYER_DEAD,
	BOSS_DEAD,
}

var state: GameState = GameState.FIGHTING

# Time before auto-restart (seconds). Leaves 1 s for death animation.
const AUTO_RESTART_DELAY: float = 4.0

var _restart_timer: Timer

# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

func _ready() -> void:
	_restart_timer = Timer.new()
	_restart_timer.one_shot = true
	_restart_timer.timeout.connect(_execute_restart)
	add_child(_restart_timer)

	SignalBus.player_died.connect(_on_player_died)
	SignalBus.boss_died.connect(_on_boss_died)
	SignalBus.restart_requested.connect(restart)

	# Small defer so the scene tree is fully ready before announcing start.
	call_deferred("_announce_start")

func _announce_start() -> void:
	SignalBus.game_started.emit()

# ---------------------------------------------------------------------------
# Input: manual restart (R key, mapped in project.godot)
# ---------------------------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("restart"):
		SignalBus.restart_requested.emit()

# ---------------------------------------------------------------------------
# State transitions
# ---------------------------------------------------------------------------

func _on_player_died() -> void:
	if state != GameState.FIGHTING:
		return
	state = GameState.PLAYER_DEAD
	SignalBus.player_lost.emit()
	_restart_timer.start(AUTO_RESTART_DELAY)

func _on_boss_died() -> void:
	if state != GameState.FIGHTING:
		return
	state = GameState.BOSS_DEAD
	SignalBus.player_won.emit()
	# Victory screen would go here; auto-restart for slice purposes.
	_restart_timer.start(AUTO_RESTART_DELAY)

# ---------------------------------------------------------------------------
# Restart
# ---------------------------------------------------------------------------

func restart() -> void:
	_restart_timer.stop()
	# Reset time scale in case hitstop was active during death.
	Engine.time_scale = 1.0
	get_tree().reload_current_scene()

func _execute_restart() -> void:
	restart()

func is_fighting() -> bool:
	return state == GameState.FIGHTING
