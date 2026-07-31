# Clock — Potential Issues

## Backward-running clock resets to hour 0 instead of wrapping to 23 at midnight

**File:** `src/js/components/Clock/Clock.js:106-123`

**Defect:**
```js
if (nextElements.seconds >= 60) {
  nextElements.minutes += Math.floor(nextElements.seconds / 60);
  nextElements.seconds = 0;
} else if (nextElements.seconds < 0) {
  nextElements.minutes += Math.floor(nextElements.seconds / 60);
  nextElements.seconds = 59;
}
if (nextElements.minutes >= 60) {
  nextElements.hours += Math.floor(nextElements.minutes / 60);
  nextElements.minutes = 0;
} else if (nextElements.minutes < 0) {
  nextElements.hours += Math.floor(nextElements.minutes / 60);
  nextElements.minutes = 59;
}
if (nextElements.hours >= 24 || nextElements.hours < 0) {
  nextElements.hours = 0;
}
```
The forward-wrap case (`hours >= 24`) correctly resets to `0`. The backward-wrap case (`hours < 0`, produced when `run === 'backward'` and minutes/seconds borrow below zero) is collapsed into the same `nextElements.hours = 0` assignment, instead of wrapping to `23` as a real 24-hour clock would when counting backward past midnight.

**Failure scenario:** Render `<Clock type="digital" run="backward" time="T00:00:05" />` (a non-duration clock running backward from just after midnight). After it counts down through `00:00:00`, the borrow logic drives `hours` to `-1`, which this code clamps to `0` rather than wrapping to `23`. The clock then gets stuck effectively re-triggering the same clamp every cycle (hours stays pinned at `0` while minutes/seconds continue to cycle), instead of correctly displaying `23:59:59` and continuing backward.