# Balance sim results (node scripts/balance-sim.mjs 104)

Bedroom artist, pop, Toronto. Strategies: paced = write/record/train weekly, release a single every 4 weeks with rollouts, gigs, rest when burnout > 20; spam = write+record+release a single every week + gig + job; casual = write every other week, release every ~7 weeks, job, occasional gig.

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
