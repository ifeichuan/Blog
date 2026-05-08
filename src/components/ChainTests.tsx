import { useState, useCallback } from "react";
import BlurText from "./BlurText";
import BlurTextGsap from "./BlurTextGsap";
import BlurTextMotion from "./BlurTextMotion";

const paragraph1 =
  "We are doing a performance test here to see how Web Animations API handles large blocks.";
const paragraph2 =
  "Notice how this paragraph starts exactly after the first one is completed. This chains the animation events beautifully.";
const paragraph3 =
  "Finally, the third paragraph completes the sequence. Comparing WAAPI, GSAP, and Framer Motion should give us clear insights!";

export const ChainTestWAAPI = () => {
  const [step, setStep] = useState(0);
  const next = useCallback(() => setStep((s) => s + 1), []);
  return (
    <div className="flex flex-col gap-8">
      <BlurText text={paragraph1} className="text-2xl" onAnimationComplete={next} />
      {step >= 1 && <BlurText text={paragraph2} className="text-2xl" onAnimationComplete={next} delay={30} />}
      {step >= 2 && <BlurText text={paragraph3} className="text-2xl" delay={20} />}
    </div>
  );
};

export const ChainTestGSAP = () => {
  const [step, setStep] = useState(0);
  const next = useCallback(() => setStep((s) => s + 1), []);
  return (
    <div className="flex flex-col gap-8">
      <BlurTextGsap text={paragraph1} className="text-2xl" onAnimationComplete={next} />
      {step >= 1 && <BlurTextGsap text={paragraph2} className="text-2xl" onAnimationComplete={next} delay={30} />}
      {step >= 2 && <BlurTextGsap text={paragraph3} className="text-2xl" delay={20} />}
    </div>
  );
};

export const ChainTestMotion = () => {
  const [step, setStep] = useState(0);
  const next = useCallback(() => setStep((s) => s + 1), []);
  return (
    <div className="flex flex-col gap-8">
      <BlurTextMotion text={paragraph1} className="text-2xl" onAnimationComplete={next} />
      {step >= 1 && <BlurTextMotion text={paragraph2} className="text-2xl" onAnimationComplete={next} delay={30} />}
      {step >= 2 && <BlurTextMotion text={paragraph3} className="text-2xl" delay={20} />}
    </div>
  );
};
