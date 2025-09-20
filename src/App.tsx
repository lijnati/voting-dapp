import { useState, useEffect } from "react";
import { ethers } from "ethers";
import VotingAbi from "./abis/Voting.json"; // put ABI here

const CONTRACT_ADDRESS = "0x4fD8693aEAF67F96D8077961847344FF485e659b";

type Candidate = {
  id: number;
  name: string;
  voteCount: number;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);

    const c = new ethers.Contract(CONTRACT_ADDRESS, VotingAbi, signer);
    setContract(c);

    const openState = await c.open();
    setOpen(openState);

    const count = await c.candidatesCount();
    const list: Candidate[] = [];
    for (let i = 0; i < count; i++) {
      const cand = await c.getCandidate(i);
      list.push({
        id: cand.id.toNumber(),
        name: cand.name,
        voteCount: cand.voteCount.toNumber(),
      });
    }
    setCandidates(list);
  }

  async function vote(id: number) {
    if (!contract) return;
    const tx = await contract.vote(id);
    await tx.wait();
    alert("Vote cast!");
    connectWallet(); // refresh state
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Voting DApp</h1>

      {account ? (
        <p className="mb-4">Connected: {account}</p>
      ) : (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}

      <div className="space-y-4 w-full max-w-md">
        {candidates.map((c) => (
          <div
            key={c.id}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-gray-600">Votes: {c.voteCount}</p>
            </div>
            <button
              className={`px-3 py-1 rounded ${
                open
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
              onClick={() => vote(c.id)}
              disabled={!open}
            >
              Vote
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
