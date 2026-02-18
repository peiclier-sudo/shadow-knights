# signal_bus.gd
# Autoload singleton: SignalBus
# Global event bus — all systems communicate through here.
# No direct node references needed; systems stay decoupled.
extends Node

# ---------------------------------------------------------------------------
# Combat events
# ---------------------------------------------------------------------------

## Emitted when a hitbox successfully connects with a hurtbox.
## attack_def may be null for environmental damage.
@warning_ignore("UNUSED_SIGNAL")
signal hit_landed(attacker: Node, victim: Node, attack_def: Resource, actual_damage: float)

## Player health events
@warning_ignore("UNUSED_SIGNAL")
signal player_damaged(amount: float, new_hp: float, max_hp: float)
@warning_ignore("UNUSED_SIGNAL")
signal player_died

## Boss health events
@warning_ignore("UNUSED_SIGNAL")
signal boss_damaged(amount: float, new_hp: float, max_hp: float)
@warning_ignore("UNUSED_SIGNAL")
signal boss_died

## I-frame window events (used by HUD / debug overlay)
@warning_ignore("UNUSED_SIGNAL")
signal iframe_started
@warning_ignore("UNUSED_SIGNAL")
signal iframe_ended

## Hitstop request: attacker and victim freeze durations in seconds
@warning_ignore("UNUSED_SIGNAL")
signal hitstop_requested(attacker_duration: float, victim_duration: float)

# ---------------------------------------------------------------------------
# Lock-on events
# ---------------------------------------------------------------------------

## Emitted when the camera acquires a lock-on target
@warning_ignore("UNUSED_SIGNAL")
signal lockon_acquired(target: Node3D)

## Emitted when lock-on is released (distance / LOS / manual toggle)
@warning_ignore("UNUSED_SIGNAL")
signal lockon_released

# ---------------------------------------------------------------------------
# Boss telegraph events (for HUD / readability effects)
# ---------------------------------------------------------------------------

## attack_id matches AttackDefinition resource names: "slam", "thrust", "aoe"
@warning_ignore("UNUSED_SIGNAL")
signal boss_attack_telegraphed(attack_id: String, duration: float)
@warning_ignore("UNUSED_SIGNAL")
signal boss_attack_active(attack_id: String)
@warning_ignore("UNUSED_SIGNAL")
signal boss_attack_ended(attack_id: String)

# ---------------------------------------------------------------------------
# Game-loop events
# ---------------------------------------------------------------------------

@warning_ignore("UNUSED_SIGNAL")
signal game_started
@warning_ignore("UNUSED_SIGNAL")
signal player_won
@warning_ignore("UNUSED_SIGNAL")
signal player_lost
@warning_ignore("UNUSED_SIGNAL")
signal restart_requested
