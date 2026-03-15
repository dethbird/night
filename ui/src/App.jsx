import { useEffect, useState } from "react";

export default function App() {
  const [compositions, setCompositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/compositions").then((r) => r.json()),
      fetch("/api/status").then((r) => r.json()),
    ]).then(([comps, status]) => {
      setCompositions(comps);
      setPlaying(status.playing);
      setLoading(false);
    });
  }, []);

  function handlePlay(name, file) {
    fetch("/api/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ composition: name, file }),
    })
      .then((r) => r.json())
      .then((data) => setPlaying(data.playing));
  }

  function handleStop() {
    fetch("/api/stop", { method: "POST" })
      .then((r) => r.json())
      .then(() => setPlaying(null));
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Compositions</h1>
        {loading ? (
          <p className="has-text-grey">Loading...</p>
        ) : (
          <div className="columns is-multiline">
            {compositions.map((c) => {
              const isPlaying = playing === c.name;
              return (
                <div key={c.name} className="column is-one-third">
                  <div className={`card${isPlaying ? " has-background-success-light" : ""}`}>
                    <div className="card-content">
                      <p className="title is-5">{c.name}</p>
                      {c.file && (
                        <p className="subtitle is-6 has-text-grey">{c.file}</p>
                      )}
                    </div>
                    <footer className="card-footer">
                      {isPlaying ? (
                        <button
                          className="card-footer-item button is-danger is-light"
                          onClick={handleStop}
                        >
                          ■ Stop
                        </button>
                      ) : (
                        <button
                          className="card-footer-item button is-success is-light"
                          onClick={() => c.file && handlePlay(c.name, c.file)}
                          disabled={!c.file}
                        >
                          ▶ Play
                        </button>
                      )}
                    </footer>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
