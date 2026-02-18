# boss_attack_selector.gd
# Chooses which of the 3 boss attacks to use next.
# Simple weighted-random selector with cooldown tracking.
# Plan: no complex AI trees for the slice — just readable selector weights.
class_name BossAttackSelector
extends Node

var boss: BossController = null

# Attack IDs match state names in the FSM.
const ATTACKS: Array[String] = ["WindupA", "WindupB", "WindupC"]

# Weights: A (slam) is favoured early; tweak here for balance passes.
var _weights: Array[float] = [0.4, 0.35, 0.25]

# Cooldown per attack so the boss doesn't repeat immediately.
var _cooldowns: Dictionary = {
	"WindupA": 0.0,
	"WindupB": 0.0,
	"WindupC": 0.0,
}

const COOLDOWN_DURATION: float = 4.0  # seconds before same attack repeats

# Cadence gap between attacks: 1.0–1.6 s (from tuning table).
const CADENCE_MIN: float = 1.0
const CADENCE_MAX: float = 1.6

var _cadence_timer: float = 0.0
var _attack_pending: String = ""

# ---------------------------------------------------------------------------
# Tick
# ---------------------------------------------------------------------------

func _process(delta: float) -> void:
	for key in _cooldowns.keys():
		if _cooldowns[key] > 0.0:
			_cooldowns[key] -= delta

	if _cadence_timer > 0.0:
		_cadence_timer -= delta

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

## Returns the FSM state name for the next attack, or "" if not ready.
func pick_attack() -> String:
	if _cadence_timer > 0.0:
		return ""

	# Build eligible list (not on cooldown).
	var eligible: Array[String] = []
	var eligible_weights: Array[float] = []
	for i in ATTACKS.size():
		if _cooldowns[ATTACKS[i]] <= 0.0:
			eligible.append(ATTACKS[i])
			eligible_weights.append(_weights[i])

	if eligible.is_empty():
		return ""

	var chosen := _weighted_pick(eligible, eligible_weights)
	_cooldowns[chosen] = COOLDOWN_DURATION
	_cadence_timer = randf_range(CADENCE_MIN, CADENCE_MAX)
	return chosen

func _weighted_pick(options: Array[String], weights: Array[float]) -> String:
	var total := 0.0
	for w in weights:
		total += w
	var roll := randf() * total
	var accum := 0.0
	for i in options.size():
		accum += weights[i]
		if roll <= accum:
			return options[i]
	return options[-1]
