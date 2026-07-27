import { Broker } from "../models/broker.model"
import { RoundRobin } from "../models/roundRobin.model"
import {ApiError} from "../utils/ApiError"

export const getNextBroker = async ()=>{

  const activeBrokers = await Broker.find({isActive:true}).sort({createdAt:1})

  if(activeBrokers.length === 0){
    throw new ApiError(404,"No active broker")
  }

  const roundRobin = await RoundRobin.findOne();

  if(!roundRobin){
    throw new ApiError(500,"Round Robin configuration not found")
  }

  const currentIndex = roundRobin.currentIndex;

  const broker = activeBrokers[currentIndex];
  
  const nextIndex = (currentIndex+1) % activeBrokers.length;

  await RoundRobin.findByIdAndUpdate(
    roundRobin._id,
    {
        currentIndex: nextIndex
    }
)

  return broker
}