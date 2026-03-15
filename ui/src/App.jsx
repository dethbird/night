import { useEffect, useState } from "react";

export default function App() {
  const [compositions, setCompositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/compositions")
      .then((r) => r.json())
      .then((data) => {
        setCompositions(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Compositions</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {compositions.map((c) => (
            <li key={c.name}>
              <strong>{c.name}</strong>
              {c.file && <span> — {c.file}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
