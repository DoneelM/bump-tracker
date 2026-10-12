import { useState } from 'react';
import { Page } from '../../components/Page';
import { SourceNote } from '../../components/SourceNote';
import { filterFish, filterFoods, FOOD_GROUPS, FOOD_SOURCE_ID, VERDICT_LABEL } from '../../data/foodSafety';


/** "Can I eat this?": New Zealand Food Safety's pregnancy table, searchable. Static, nothing stored. */
export function FoodSafetyPage() {
  const [query, setQuery] = useState('');
  const groups = filterFoods(FOOD_GROUPS, query);
  const fish = filterFish(query);
  const nothing = groups.length === 0 && fish.length === 0;
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Page title="Food safety" icon="🥗" back={{ to: '/tools', label: 'Tools' }}>
      <p className="lead">What New Zealand Food Safety says about food when you’re pregnant.</p>

      <div className="field food-search">
        <label className="field__label" htmlFor="food-q">
          Search a food
        </label>
        <input
          id="food-q"
          className="input"
          type="search"
          autoComplete="off"
          placeholder="e.g. feta, sushi, ham"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="visually-hidden" role="status">
        {nothing ? 'No matches' : `${count} ${count === 1 ? 'food' : 'foods'} shown`}
      </p>

      {nothing && <p className="muted">Nothing matches “{query.trim()}”. Try a simpler word, or ask your midwife/LMC.</p>}

      {groups.map((g, gi) => (
        <section key={g.title} className="card" aria-labelledby={`food-g${gi}`}>
          <h2 id={`food-g${gi}`}>{g.title}</h2>
          <ul className="food-list">
            {g.items.map((i) => (
              <li key={i.food} className="food-item">
                <span className="food-item__head">
                  <span className="food-item__name">{i.food}</span>
                  <span className={`tag food-tag food-tag--${i.verdict}`}>{VERDICT_LABEL[i.verdict]}</span>
                </span>
                {i.examples && <span className="muted">{i.examples}</span>}
                {i.advice !== `${VERDICT_LABEL[i.verdict]}.` && <span className="food-item__advice">{i.advice}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {fish.length > 0 && (
        <section className="card" aria-labelledby="food-fish">
          <h2 id="food-fish">Fish and mercury</h2>
          <p className="muted">How often each fish is fine to eat, to keep mercury down.</p>
          {fish.map((b) => (
            <div key={b.advice} className="fish-band">
              <h3>{b.advice}</h3>
              <p>{b.fish.join(', ')}</p>
            </div>
          ))}
        </section>
      )}
      <SourceNote id={FOOD_SOURCE_ID} />
    </Page>
  );
}
