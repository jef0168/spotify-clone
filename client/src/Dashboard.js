import { useState, useEffect } from "react";
import { Container, Form } from "react-bootstrap";
import useAuth from "./useAuth";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResult from "./TrackSearchResult";
import Player from './Player'
import axios from "axios";

const spoitfyApi = new SpotifyWebApi({
  clientId: "27d6bcc83c6e4d5bbcaeabb7a6d334ad",
});
export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState();
  const [lyrics, setLyrics] = useState("")

  const chooseTrack = (track) =>{
      setPlayingTrack(track)
      setSearch('')
  }

  useEffect(() => {
    if(!playingTrack) return

    axios.get('http://localhost:3001/lyrics', {
        params: {
            track : playingTrack.title,
            artist : playingTrack.artist
        }
    }).then(res => {
        setLyrics(res.data.lyrics)
    })
  }, [playingTrack])
  useEffect(() => {
    if (!accessToken) return;
    spoitfyApi.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!search) return setSearchResults([]);
    if (!accessToken) return;

    let cancel = false;
    spoitfyApi.searchTracks(search).then((res) => {
      if (cancel) return;
      setSearchResults(
        res.body.tracks.items.map((track) => {
          const smallestAlbumImg = track.album.images.reduce(
            (smallest, image) => {
              if (image.height < smallest.height) return image;
              return smallest;
            }
          );
          return {
            artist: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImg.url,
          };
        })
      );
    });
    return () => (cancel = true);
  }, [search, accessToken]);
  return (
    <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}>
      <Form.Control
        type="search"
        placeholder="Search Songs/Artists"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
        {searchResults.map((track) => (
          <TrackSearchResult track={track} chooseTrack={chooseTrack} />
        ))}
      </div>
      {searchResults.length === 0 && (
          <div className="text-center" style={{whiteSpace: "pre "}}>{lyrics}</div>
      ) }
      <div>
        <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
    </Container>
  );
}
