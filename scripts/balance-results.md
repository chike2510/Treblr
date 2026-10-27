# Balance sim results (node scripts/balance-sim.mjs 104)

Bedroom artist, pop, Toronto. Strategies: paced = write/record/train weekly, release a single every 4 weeks with rollouts, gigs, rest when burnout > 20; spam = write+record+release a single every week + gig + job; casual = write every other week, release every ~7 weeks, job, occasional gig.

## v4 (2026-10-27, fix list)

```
┌─────────┬──────────┬──────┬────────┬───────┬──────┬──────┬─────────┬─────────┬─────┬──────┬──────┬─────────┬────────┬─────┬─────────┬──────────┬───────┐
│ (index) │ strat    │ seed │ hot100 │ top10 │ no1  │ best │ ml52    │ ml104   │ q60 │ qMax │ hype │ burnMax │ energy │ rel │ fans    │ cash     │ nan   │
├─────────┼──────────┼──────┼────────┼───────┼──────┼──────┼─────────┼─────────┼─────┼──────┼──────┼─────────┼────────┼─────┼─────────┼──────────┼───────┤
│ 0       │ 'paced'  │ 11   │ 44     │ 83    │ null │ 4    │ '10.4M' │ '39.0M' │ 84  │ 97   │ 39   │ 27      │ 75     │ 26  │ '5.11M' │ '$19.6M' │ false │
│ 1       │ 'paced'  │ 22   │ 42     │ 87    │ null │ 6    │ '8.87M' │ '35.7M' │ 82  │ 94   │ 38   │ 28      │ 75     │ 26  │ '4.88M' │ '$15.9M' │ false │
│ 2       │ 'paced'  │ 33   │ 42     │ 70    │ null │ 2    │ '13.3M' │ '46.2M' │ 86  │ 95   │ 38   │ 25      │ 73     │ 26  │ '6.20M' │ '$18.6M' │ false │
│ 3       │ 'spam'   │ 11   │ null   │ null  │ null │ null │ '131K'  │ '1.65M' │ 51  │ 60   │ 27   │ 0       │ 70     │ 86  │ '239K'  │ '$3.45M' │ false │
│ 4       │ 'spam'   │ 22   │ null   │ null  │ null │ null │ '339K'  │ '2.43M' │ 54  │ 63   │ 29   │ 0       │ 77     │ 100 │ '365K'  │ '$4.63M' │ false │
│ 5       │ 'spam'   │ 33   │ null   │ null  │ null │ null │ '347K'  │ '2.14M' │ 54  │ 63   │ 28   │ 0       │ 78     │ 100 │ '320K'  │ '$4.94M' │ false │
│ 6       │ 'casual' │ 11   │ null   │ null  │ null │ null │ '38K'   │ '174K'  │ 50  │ 60   │ 14   │ 9       │ 62     │ 15  │ '33K'   │ '$321K'  │ false │
│ 7       │ 'casual' │ 22   │ null   │ null  │ null │ null │ '24K'   │ '157K'  │ 50  │ 56   │ 13   │ 9       │ 61     │ 15  │ '32K'   │ '$247K'  │ false │
│ 8       │ 'casual' │ 33   │ null   │ null  │ null │ null │ '14K'   │ '127K'  │ 51  │ 56   │ 13   │ 9       │ 61     │ 15  │ '25K'   │ '$193K'  │ false │
└─────────┴──────────┴──────┴────────┴───────┴──────┴──────┴─────────┴─────────┴─────┴──────┴──────┴─────────┴────────┴─────┴─────────┴──────────┴───────┘
```

Long horizon (paced, 200 weeks): seed 22 → first #1 wk 116, Star wk 126, Superstar wk 171, 85M listeners, $155M cash.
Seed 33 → first #1 wk 111, Star wk 114, Superstar wk 158, 88M listeners, $171M cash (real superstars: ~60–130M listeners).

Key levers (src/engine/model.js, tick.js, career.js): fame = 26-week weighted rolling listeners; discovery scales with that
rolling reach (DISC_SAT 2e6, Q_EXP 3.5, DISCOVERY_K 1300); new fans damped by 1/(1+fans/3M); audience focus exponent 1.6
(hits pull away from deep cuts); NPC per-song streams 0.4×ML; arenas need Established, stadiums need Star status; brand fees
fans×0.03; energy refills fully each week (burnout trims the cap by ≤20).

## v3 (before the fix list, for comparison)

```
┌─────────┬──────────┬──────┬────────┬───────┬──────┬──────┬─────────┬──────────┬─────┬──────┬──────┬─────────┬────────┬─────┬─────────┬──────────┬───────┐
│ (index) │ strat    │ seed │ hot100 │ top10 │ no1  │ best │ ml52    │ ml104    │ q60 │ qMax │ hype │ burnMax │ energy │ rel │ fans    │ cash     │ nan   │
├─────────┼──────────┼──────┼────────┼───────┼──────┼──────┼─────────┼──────────┼─────┼──────┼──────┼─────────┼────────┼─────┼─────────┼──────────┼───────┤
│ 0       │ 'paced'  │ 11   │ 51     │ 74    │ 86   │ 1    │ '12.5M' │ '129.5M' │ 83  │ 88   │ 37   │ 100     │ 57     │ 26  │ '17.5M' │ '$76.5M' │ false │
│ 1       │ 'paced'  │ 22   │ 43     │ 74    │ 92   │ 1    │ '22.5M' │ '138.0M' │ 80  │ 89   │ 39   │ 100     │ 63     │ 26  │ '18.0M' │ '$95.0M' │ false │
│ 2       │ 'paced'  │ 33   │ 39     │ 81    │ 99   │ 1    │ '23.5M' │ '122.3M' │ 79  │ 87   │ 38   │ 100     │ 59     │ 26  │ '16.9M' │ '$71.3M' │ false │
│ 3       │ 'spam'   │ 11   │ null   │ null  │ null │ null │ '766K'  │ '7.57M'  │ 57  │ 66   │ 29   │ 16      │ 76     │ 100 │ '1.21M' │ '$3.98M' │ false │
│ 4       │ 'spam'   │ 22   │ null   │ null  │ null │ null │ '698K'  │ '7.39M'  │ 56  │ 64   │ 31   │ 16      │ 76     │ 100 │ '1.13M' │ '$3.96M' │ false │
│ 5       │ 'spam'   │ 33   │ null   │ null  │ null │ null │ '812K'  │ '8.81M'  │ 54  │ 66   │ 30   │ 16      │ 78     │ 104 │ '1.34M' │ '$4.26M' │ false │
│ 6       │ 'casual' │ 11   │ null   │ null  │ null │ null │ '23K'   │ '322K'   │ 51  │ 62   │ 13   │ 20      │ 61     │ 15  │ '61K'   │ '$486K'  │ false │
│ 7       │ 'casual' │ 22   │ null   │ null  │ null │ null │ '26K'   │ '377K'   │ 50  │ 59   │ 13   │ 22      │ 62     │ 15  │ '73K'   │ '$574K'  │ false │
│ 8       │ 'casual' │ 33   │ null   │ null  │ null │ null │ '25K'   │ '329K'   │ 50  │ 58   │ 12   │ 20      │ 62     │ 15  │ '63K'   │ '$507K'  │ false │
└─────────┴──────────┴──────┴────────┴───────┴──────┴──────┴─────────┴──────────┴─────┴──────┴──────┴─────────┴────────┴─────┴─────────┴──────────┴───────┘
```
