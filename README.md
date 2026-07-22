<div align="center">

<img src="src/assets/icon.svg" alt="Tally icon" width="96" height="96">

### A small calculator for big, messy questions.

Type the way you think. Tally handles the arithmetic, the units, the dates, and the context.

<br>

![Platform](https://img.shields.io/badge/desktop-macOS%20%7C%20Windows%20%7C%20Linux-25283d?style=flat-square)
![License](https://img.shields.io/badge/license-GPL--3.0-25283d?style=flat-square)
![Release](https://img.shields.io/badge/release-v1.0.0-6c63ff?style=flat-square)

</div>

<br>

## Think it. Type it. Tally it.

Tally is a clean, fast desktop calculator that understands both traditional expressions and everyday language. It stays out of the way until you need it, then turns a rough question into a useful answer.

<div align="center">

<img src="https://aidan846.github.io/tally/Tally-Example.png" alt="Tally example calculations" width="720">

</div>

## Built for the in-between stuff

|  | Feature | What it’s good for |
| --- | --- | --- |
| `01` | **Natural-language math** | `5 times 3`, `20% off 85`, `sqrt4`, `sum of 12 and 8` |
| `02` | **Unit conversions** | Length, mass, temperature, time, volume, area, speed, pressure, data, and more |
| `03` | **Dates that behave** | Add or subtract days, weeks, months, and years; compare dates; use workdays |
| `04` | **Time zones** | Ask for the time anywhere or convert a time between cities |
| `05` | **Money math** | Convert currencies and combine currency values with live exchange rates |
| `06` | **Market snapshots** | Look up stock prices, open/high/low/close values, historical closes, and price differences |
| `07` | **Variables & history** | Name values, reuse them later, reference `prev`, then total or average the results |
| `08` | **Quick statistics** | Average, median, midpoint, random numbers, rounding, and common math functions |
| `09` | **Current weather** | Check named locations in local units, or type `Weather` to use your current location |

## A calculator that keeps up

### One line at a time

Each calculation gets its own row, so a chain of thoughts stays readable. Press **Enter** to continue the thread. Double-click an answer to copy it.

### Quietly customizable

Choose light, dark, or automatic appearance. Set the precision you want, from whole numbers to five decimal places. Your preferences stick around.

### Keyboard-first by design

| Shortcut | Action |
| --- | --- |
| `Enter` | Add the next calculation row |
| `C C C` | Clear all calculations |
| `X X` | Delete the current row |
| `Ctrl C` | Copy the current line |

## More than a basic calculator

Tally is especially useful when the question crosses categories:

```text
price = $24.99
tax = 8.875%
price + price * tax

launch = June 12 2026
launch + 3 workdays

60 mph to km/h
10:30 am New York to London
```

It’s made for the quick conversions, estimates, comparisons, and tiny decisions that don’t deserve a spreadsheet.

<details>
<summary><strong>All Features</strong></summary>

| Feature | Input (example) | Output (example) |
| --- | --- | --- |
| Basic arithmetic | `18 * 7 + 4` | `130.0000` |
| Arrays and ranges | `1:10` | `[1.0000, 2.0000, 3.0000, 4.0000, 5.0000, 6.0000, 7.0000, 8.0000, 9.0000, 10.0000]` *(precision-dependent)* |
| Natural-language math | `5 times 3` | `15.0000` |
| Math functions | `sqrt4`, `abs -8`, `sin(pi / 2)`, `log10(1000)` | `2.0000`, `8.0000`, `1.0000`, `3.0000` |
| Percentages | `20% off 85` | `68.0000` |
| Percentage of a value | `15% of 240` | `36.0000` |
| Percentage change | `120 is what percent of 150` | `80.0000%` |
| Percentage increase/decrease | `80 increased by 25%` | `100.0000` |
| Length conversion | `60 miles to km` | `96.5606 km` |
| Mass conversion | `2.5 kg to lb` | `5.5116 lb` |
| Temperature conversion | `72 F to C` | `22.0000 degC` |
| Time-duration conversion | `2.5 hours to minutes` | `150.0000 min` |
| Volume conversion | `3 cups to ml` | `709.7640 ml` |
| Area conversion | `2 acres to m2` | `8093.7128 m2` |
| Speed conversion | `60 mph to km/h` | `96.5606 km/h` |
| Pressure conversion | `1 atm to psi` | `14.6959 psi` |
| Data-size conversion | `5 GB to MB` | `5120.0000 MB` |
| Magnitude conversion | `3 million to thousand` | `3000.0000 thousand` |
| Date arithmetic | `June 12 2026 + 3 workdays` | `17 June 2026` |
| Relative dates | `10 days ago` | `a date 10 days before today` |
| Date differences | `June 1 2026 to June 12 2026` | `1 week 4 days` |
| Weeks between dates | `weeks between June 1 and June 29` | `4 weeks` |
| Current date/time | `date`, `time`, `now` | `the current local date/time` |
| Time in a location | `Tokyo time` | `the current time in Tokyo` |
| Time-zone conversion | `10:30 am New York to London` | `3:30 pm` |
| Currency conversion | `$25 to EUR` | `€21.00` *(rate-dependent)* |
| Currency arithmetic | `price = $24.99` then `price * 2` | `$49.98` |
| Variables | `tax = 8.875%` then `100 * tax` | `8.8750` |
| Previous result | `12 * 4` then `prev + 5` | `53.0000` |
| Totals and averages | `sum`, `average` after several rows | `the total or average of prior numeric results` |
| Statistics | `average 10 20 30`, `median 1 8 3 4 5` | `20.0000`, `4.0000` |
| Midpoint | `midpoint between 10 and 20` | `15.0000` |
| Random numbers | `random number between 10 and 20` | `an integer from 10 through 20` |
| Rounding and signs | `round(3.14159, 2)`, `ceil 2.1`, `floor 2.9`, `sign -4` | `3.14`, `3.0000`, `2.0000`, `-1.0000` |
| Scientific notation | `scientific 123456` | `1.2346e+5` |
| CSS screen units | `ppi = 96` then `192 px to m` | `0.0508 m` |
| Stock quotes | `AAPL` or `price of MSFT` | `the latest market price` *(market-dependent)* |
| Stock details | `AAPL open`, `AAPL high today`, `AAPL low today`, `AAPL close` | `the requested market value` *(market-dependent)* |
| Historical stock price | `AAPL on 2025-01-02` | `the closing price for that date` *(market-dependent)* |
| Stock comparison | `AAPL - MSFT` | `the price difference` *(market-dependent)* |
| Weather | `weather in Sydney` or `weather` | `current local temperature and conditions` *(live)* |

</details>

## Releases

Grab the latest packaged release for your platform from the project’s release page. Tally ships as a native desktop app for macOS, Windows, and Linux.

<details>
<summary><strong>For contributors</strong></summary>

```bash
npm install
npm run start
```

Run the regression suite with `npm test`.

</details>

<br>

<div align="center">

Made for the little calculations that add up.

</div>
