export type SportType = 'athlete' | 'team' | 'coach'

interface BaseSportEntity {
  name: string
  sport: string
  link?: string
  note?: string
}

export interface Athlete extends BaseSportEntity {
  team: string
}

export interface Team extends BaseSportEntity {
}

export interface Coach extends BaseSportEntity {
  team: string
}

export type SportRecord = Athlete | Team | Coach

// Athletes
export const athlete: Athlete[] = [
  {
    name: 'Max Verstappen',
    sport: 'Formula 1',
    team: 'Red Bull Racing',
  },
  {
    name: 'Bernado Silva',
    sport: 'Soccer',
    team: 'Manchester City',
  },
  {
    name: 'Lionel Messi',
    sport: 'Soccer',
    team: 'Inter Miami',
  },
  {
    name: 'Cristiano Ronaldo',
    sport: 'Soccer',
    team: 'Al Nassr',
  },
  {
    name: 'Kevin De Bruyne',
    sport: 'Soccer',
    team: 'Napoli',
  },
  {
    name: 'Hasegawa Yui',
    sport: 'Soccer',
    team: 'Manchester City Women',
  },
  {
    name: 'Rodri',
    sport: 'Soccer',
    team: 'Manchester City',
  },
  {
    name: 'Pedri',
    sport: 'Soccer',
    team: 'FC Barcelona',
  },
]

// Teams
export const team: Team[] = [
  {
    name: 'Red Bull Racing',
    sport: 'Formula 1',
    link: 'https://www.redbullracing.com',
  },
  {
    name: 'Manchester City',
    sport: 'Soccer',
    link: 'https://www.mancity.com',
  },
  {
    name: 'Manchester United',
    sport: 'Soccer',
    link: 'https://www.manutd.com',
  },
  {
    name: 'FC Barcelona',
    sport: 'Soccer',
    link: 'https://www.fcbarcelona.com',
  },
]

// Coaches
export const coach: Coach[] = [
  {
    name: 'Pep Guardiola',
    sport: 'Soccer',
    team: 'Manchester City',
  },
]

export const sports: Record<SportType, SportRecord[]> = {
  team,
  athlete,
  coach,
}
