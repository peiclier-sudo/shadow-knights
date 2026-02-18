# main.gd
# Bootstrap script for Main.tscn.
# Wires cross-scene node references after all instances are ready.
# Runs once at startup; no per-frame logic here.
extends Node3D

@onready var _player: PlayerController = $Player
@onready var _boss: BossController = $Boss01
@onready var _camera_rig: LockOnCameraController = $CombatCameraRig
@onready var _telegraph: TelegraphController = $TelegraphController

func _ready() -> void:
	# Give camera a reference to the player (for smooth follow).
	_camera_rig._player = _player
	_player.camera_rig = _camera_rig

	# Give boss a reference to the player (for AI targeting).
	_boss.player = _player

	# Register camera rig in group so HitResolver can find it.
	_camera_rig.add_to_group("camera_rig")

	# Connect game-loop UI feedback.
	SignalBus.player_won.connect(_on_player_won)
	SignalBus.player_lost.connect(_on_player_lost)

func _on_player_won() -> void:
	print("[Main] Player won! Restarting in 4 s.")

func _on_player_lost() -> void:
	print("[Main] Player died! Restarting in 4 s.")
