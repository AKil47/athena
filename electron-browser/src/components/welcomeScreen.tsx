"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useUser } from "@/lib/userContext";
import totoroOk from "../../../images/totoro_ok.png";
import dragon from "../../../images/dragon-bgremoved.png";
import howl from "../../../images/howl.png";

export default function WelcomeScreen() {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { setUser } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(name, goal);
    setSubmitted(true);
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center relative flex items-center justify-center"
      style={{
        backgroundImage: `url(${howl.src})`,
      }}
    >
      {/* Conditionally render content */}
      {!submitted ? (
        <div className="relative bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-lg max-w-xl w-full">
          <h1 className="text-4xl font-bold text-center mb-6 text-black">
            Start your focus session with Athena
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center space-x-4">
              {/* Inputs container */}
              <div className="flex flex-col space-y-6 flex-grow">
                {/* Name Input */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-black">
                    What's your name?
                  </label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="flex-grow rounded-xl bg-white/90 border border-gray-300 px-4 py-2 text-black 
                      focus:outline-none focus:ring focus:ring-primary"
                  />
                </div>
                {/* Goal Input */}
                <div className="space-y-2">
                  <label htmlFor="goal" className="text-sm font-medium text-black">
                    I would like to focus on...
                  </label>
                  <Input
                    id="goal"
                    placeholder="I would like to focus on..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    required
                    className="flex-grow rounded-xl bg-white/90 border border-gray-300 px-4 py-2 text-black 
                      focus:outline-none focus:ring focus:ring-primary"
                  />
                </div>
              </div>
              {/* Totoro Button */}
              <button
                type="submit"
                className="flex-shrink-0 w-16 h-16 bg-transparent border-none outline-none"
              >
                <Image
                  src={totoroOk}
                  alt="Totoro OK Button"
                  width={64}
                  height={64}
                />
              </button>
            </div>
          </form>
        </div>
      ) : (
        // New content with fade-in transition
        <div className="animate-fadeIn relative bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-lg max-w-xl w-full">
          <h2 className="text-3xl font-bold text-center text-black">
            Welcome to your focus session, {name}!
          </h2>
          {/* Additional content can go here */}
        </div>
      )}

      {/* Dragon Image - Flipped horizontally and bigger */}
      <Image
        src={dragon}
        alt="Dragon"
        width={450}
        height={420}
        className="absolute bottom-0 left-0 transform scale-x-[-1]"
      />
    </div>
  );
}
