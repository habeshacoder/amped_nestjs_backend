/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SearchDto, SearchChannelDto } from "./dto";

@Injectable()
export class SearchService {
    constructor(private readonly prisma: PrismaService) {}

    async suggest(searchDto: SearchDto) {

        const where = new Map<string, unknown>()
            
        // where.set("sex", opSex)
        
        if (searchDto.type != null) {
            where.set("type", searchDto.type)
        }

        if (searchDto.parent != null) {
            where.set("parent", searchDto.parent)
        }

        if (searchDto.genere != null) {
            where.set("genere", searchDto.genere)
        }

        if (searchDto.catagory != null) {
            where.set("catagory", searchDto.catagory)
        }

        if (searchDto.key != null) {
            where.set("title", { contains: searchDto.key.trim()})
        }

        const whe = Object.fromEntries(where) 

        const foundMatterial = await this.prisma.material.findMany({
            where: whe
        })

        let mainMatches = foundMatterial
        let filteredSoFar = []
        let tempo = null

        if (searchDto.time_from != null && searchDto.time_to != null) {
            for await (let match of mainMatches) {                    
                const age = this.calculateAge(match.created_at)
                const time_from = this.calculateAge(searchDto.time_from)
                const time_to = this.calculateAge(searchDto.time_to)

                if (age >= time_from && age <= time_to) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        } else if (searchDto.time_from != null && searchDto.time_to == null) {
            for await (let match of mainMatches) {                    
                const age = this.calculateAge(match.created_at)
                const time_from = this.calculateAge(searchDto.time_from)

                if (age >= time_from) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        } else if (searchDto.time_from == null && searchDto.time_to != null) {
            for await (let match of mainMatches) {                    
                const age = this.calculateAge(match.created_at)
                const time_to = this.calculateAge(searchDto.time_to)

                if (age <= time_to) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        }

        if (filteredSoFar.length > 0) {
            mainMatches = filteredSoFar
            filteredSoFar = []
        }

        if (searchDto.price_from != null && searchDto.price_to != null) {
            for await (let match of mainMatches) {    

                if (match.price >= searchDto.price_from && match.price <= searchDto.price_to) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo != null && tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        } else if (searchDto.price_from != null && searchDto.price_to == null) {
            for await (let match of mainMatches) {

                if (match.price >= searchDto.price_from) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        } else if (searchDto.price_from == null && searchDto.price_to != null) {
            for await (let match of mainMatches) {

                if (match.price <= searchDto.price_to) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        }

        if (filteredSoFar.length > 0) {
            mainMatches = filteredSoFar
            filteredSoFar = []
        }

        return {
            mainMatches,
            message: 'Matches returned successfully.',
            success: true
        }
    }

    async suggestChannel(searchChannelDto: SearchChannelDto) {

        const where = new Map<string, unknown>()
            
        // where.set("sex", opSex)

        if (searchChannelDto.key != null) {
            where.set("name", { contains: searchChannelDto.key})
        }

        // if (searchChannelDto.key != null) {
        //     where.set("description", { contains: searchChannelDto.key})
        // }

        var whe = Object.fromEntries(where) 

        const foundChannel = await this.prisma.channel.findMany({
            where: whe
        })

        var mainMatches = foundChannel
        var filteredSoFar = []
        var tempo = null

        if (searchChannelDto.time_from != null && searchChannelDto.time_to != null) {
            for await (var match of mainMatches) {                    
                let age = this.calculateAge(match.created_at)
                let time_from = this.calculateAge(searchChannelDto.time_from)
                let time_to = this.calculateAge(searchChannelDto.time_to)

                if (age >= time_from && age <= time_to) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        } else if (searchChannelDto.time_from != null && searchChannelDto.time_to == null) {
            for await (var match of mainMatches) {                    
                let age = this.calculateAge(match.created_at)
                let time_from = this.calculateAge(searchChannelDto.time_from)

                if (age >= time_from) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        } else if (searchChannelDto.time_from == null && searchChannelDto.time_to != null) {
            for await (var match of mainMatches) {                    
                let age = this.calculateAge(match.created_at)
                let time_to = this.calculateAge(searchChannelDto.time_to)

                if (age <= time_to) {
                    tempo = mainMatches.filter(ma => ma == match);
                }
                    
                if (tempo.length > 0) {
                    filteredSoFar.push(tempo[0])
                    tempo = null
                }
            }
        }

        if (filteredSoFar.length > 0) {
            mainMatches = filteredSoFar
            filteredSoFar = []
        }

        // if (searchChannelDto.price_from != null && searchChannelDto.price_to != null) {
        //     for await (var match of mainMatches) {    

        //         if (match.price >= searchDto.price_from && match.price <= searchDto.price_to) {
        //             tempo = mainMatches.filter(ma => ma == match);
        //         }
                    
        //         if (tempo.length > 0) {
        //             filteredSoFar.push(tempo[0])
        //             tempo = null
        //         }
        //     }
        // } else if (searchDto.price_from != null && searchDto.price_to == null) {
        //     for await (var match of mainMatches) {

        //         if (match.price >= searchDto.price_from) {
        //             tempo = mainMatches.filter(ma => ma == match);
        //         }
                    
        //         if (tempo.length > 0) {
        //             filteredSoFar.push(tempo[0])
        //             tempo = null
        //         }
        //     }
        // } else if (searchDto.price_from == null && searchDto.price_to != null) {
        //     for await (var match of mainMatches) {

        //         if (match.price <= searchDto.price_to) {
        //             tempo = mainMatches.filter(ma => ma == match);
        //         }
                    
        //         if (tempo.length > 0) {
        //             filteredSoFar.push(tempo[0])
        //             tempo = null
        //         }
        //     }
        // }

        // if (filteredSoFar.length > 0) {
        //     mainMatches = filteredSoFar
        //     filteredSoFar = []
        // }

        return {
            mainMatches,
            message: 'Matches returned successfully.',
            success: true
        }
    }

    calculateAge(date: Date) {
        const dob = new Date(date)//"06/24/2008");  
        
        //calculate month difference from current date in time  
        const month_diff = Date.now() - dob.getTime()
          
        //convert the calculated difference in date format  
        const age_dt = new Date(month_diff)
          
        //extract year from date      
        const year = age_dt.getUTCFullYear()
          
        //now calculate the age of the user  
        const age = year - 1970
          
        //display the calculated age  
        return age  
        // date.split("/")
    }
}